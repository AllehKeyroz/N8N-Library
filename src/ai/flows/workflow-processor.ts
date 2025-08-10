'use server';
/**
 * @fileOverview Um agente de IA para processar e enriquecer workflows do n8n.
 *
 * - processWorkflow - Uma função que analisa um workflow n8n e extrai metadados.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  ProcessWorkflowInput,
  ProcessWorkflowInputSchema,
  ProcessWorkflowOutput,
  ProcessWorkflowOutputSchema,
} from './workflow-types';

export async function processWorkflow(
  input: ProcessWorkflowInput
): Promise<ProcessWorkflowOutput> {
  return processWorkflowFlow(input);
}

const TranslatedNamesSchema = z.object({
  translations: z
    .array(z.object({ original: z.string(), translated: z.string() }))
    .describe(
      'Uma lista de objetos, cada um contendo o nome original do nó e sua tradução para o português.'
    ),
});

const analysisPrompt = ai.definePrompt({
  name: 'processWorkflowAnalysisPrompt',
  input: {
    schema: z.object({
      workflowJson: z.string(),
      categories: z.array(z.string()),
      nodeNames: z.array(z.string()),
    }),
  },
  output: {
    schema: z.object({
      analysis: ProcessWorkflowOutputSchema.omit({
        translatedWorkflowJson: true,
      }),
      translatedNodes: TranslatedNamesSchema,
    }),
  },
  prompt: `Você é um especialista em n8n e automação de processos. Sua tarefa é analisar o JSON de um workflow do n8n, extrair informações importantes e traduzir os nomes dos nós.

Analise o seguinte workflow:
\`\`\`json
{{{workflowJson}}}
\`\`\`

Tarefas:
1.  **Análise de Metadados:**
    *   **Nome:** Crie um nome curto, específico e objetivo para o workflow (máximo 50 caracteres). Evite termos genéricos como "Automação" ou "Workflow". Exemplo: "Sincronizar Pedidos do Stripe com Notion".
    *   **Descrição:** Escreva uma descrição concisa e de alto nível, focada no objetivo e no resultado final do workflow. Ideal para um usuário final entender o valor da automação.
    *   **Categoria:** Com base na funcionalidade geral do workflow e nos nomes dos nós ([{{#each nodeNames}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}]), classifique-o em uma das seguintes categorias: [{{{categories}}}]. Se nenhuma categoria se encaixar perfeitamente, crie uma nova categoria que seja específica e apropriada.
    *   **Plataformas:** Identifique e liste as principais plataformas, aplicativos ou serviços que são integrados neste workflow (ex: "Notion", "Google Sheets", "Stripe", "Slack").
    *   **Explicação:** Gere uma explicação técnica detalhada, em português, de como o workflow funciona. Descreva cada passo (nó), o que ele faz, e como os dados fluem através do processo. Esta explicação será usada como uma documentação técnica interna ou um "bloco de notas" para desenvolvedores. No final da explicação, adicione em uma nova linha o texto "Para mais automações, siga: instagram.com/kds_brasil".

2.  **Tradução dos Nomes dos Nós:**
    *   Traduza a seguinte lista de nomes de nós para o português do Brasil.
    *   Retorne o resultado como um array de objetos, onde cada objeto tem uma chave "original" e uma "translated".
    *   **Nomes para traduzir:** [{{#each nodeNames}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}]
`,
});

const processWorkflowFlow = ai.defineFlow(
  {
    name: 'processWorkflowFlow',
    inputSchema: ProcessWorkflowInputSchema,
    outputSchema: ProcessWorkflowOutputSchema,
  },
  async (input) => {
    // 1. Parse the workflow JSON
    let workflow;
    try {
      // Clean the input string to remove potential BOM characters
      const cleanedJson = input.workflowJson.trim().replace(/^\uFEFF/, '');
      workflow = JSON.parse(cleanedJson);
    } catch (error) {
      console.error('Invalid workflow JSON:', error);
      throw new Error('O arquivo JSON do workflow fornecido é inválido.');
    }

    const categories = [
      'IA',
      'Vendas',
      'Operações de TI',
      'Marketing',
      'Operações de Documentos',
      'Suporte',
      'Finanças',
      'RH',
      'Produtividade',
    ];

    // Extract node names to be translated
    const nodeNamesToTranslate = workflow.nodes
      .map((node: any) => node.name)
      .filter((name: any) => typeof name === 'string' && name.trim() !== '');

    // 2. Run the unified analysis and translation prompt
    const {output} = await analysisPrompt({
      workflowJson: input.workflowJson,
      categories: categories,
      nodeNames: nodeNamesToTranslate,
    });

    if (!output || !output.analysis || !output.translatedNodes) {
      throw new Error('A IA não conseguiu analisar e traduzir o workflow.');
    }

    const { analysis: analysisResult, translatedNodes } = output;


    // 3. Create a map for quick translation lookup
    const translationMap = new Map(
      translatedNodes.translations.map((t) => [t.original, t.translated])
    );
    
    // 4. Update connections BEFORE updating node names
    if (workflow.connections && typeof workflow.connections === 'object') {
      const originalConnections = JSON.parse(JSON.stringify(workflow.connections));
      const updatedConnections: Record<string, any> = {};

      for (const sourceNodeName of Object.keys(originalConnections)) {
        const translatedSource = translationMap.get(sourceNodeName) || sourceNodeName;
        const sourceOutputs = originalConnections[sourceNodeName];
        
        updatedConnections[translatedSource] = {};

        for (const outputName of Object.keys(sourceOutputs)) {
          // Each output (e.g., 'main', 'done', 'loop') is an array of destination arrays.
          const destinationGroups = sourceOutputs[outputName];
          if (Array.isArray(destinationGroups)) {
             updatedConnections[translatedSource][outputName] = destinationGroups.map((destGroup: any) => {
                if (Array.isArray(destGroup)) {
                    return destGroup.map((dest: any) => {
                       const translatedDestNode = translationMap.get(dest.node) || dest.node;
                       return { ...dest, node: translatedDestNode };
                    });
                }
                return destGroup; // Should not happen based on n8n structure, but safe to keep.
             });
          }
        }
      }
      workflow.connections = updatedConnections;
    }


    // 5. Update node names and create sticky note in the workflow object
    let minX = Infinity;
    let minY = Infinity;

    workflow.nodes.forEach((node: any) => {
      if (node.name && translationMap.has(node.name)) {
        node.name = translationMap.get(node.name);
      }
      if (node.position) {
          if(node.position[0] < minX) minX = node.position[0];
          if(node.position[1] < minY) minY = node.position[1];
      }
    });
    
    // Create and add the sticky note
    const stickyNote = {
      parameters: {
        content: analysisResult.explanation,
        height: 400,
        width: 500
      },
      id: `sticky-note-${Date.now()}`,
      name: 'Explicação do Workflow',
      type: 'n8n-nodes-base.stickyNote',
      typeVersion: 1,
      position: [minX - 550, minY],
    };

    workflow.nodes.push(stickyNote);


    // 6. Stringify the modified workflow
    const translatedWorkflowJson = JSON.stringify(workflow, null, 2);

    // 7. Return the combined result
    return {
      ...analysisResult,
      translatedWorkflowJson,
    };
  }
);
