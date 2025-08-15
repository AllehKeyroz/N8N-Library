'use server';
/**
 * @fileOverview Um agente de IA para processar e enriquecer workflows do n8n.
 *
 * - processWorkflow - Uma função que analisa um workflow n8n e extrai metadados.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import {saveCredential} from '@/services/credential-service';
import {
  ProcessWorkflowInput,
  ProcessWorkflowInputSchema,
  ProcessWorkflowOutput,
  ProcessWorkflowOutputSchema,
  CredentialInfoSchema,
} from './workflow-types';
import { createHash } from 'crypto';


export async function processWorkflow(
  input: ProcessWorkflowInput
): Promise<ProcessWorkflowOutput> {
  return processWorkflowFlow(input);
}

const TranslatedNamesSchema = z.object({
  translations: z
    .array(z.object({original: z.string(), translated: z.string()}))
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
        originalWorkflowHash: true,
        translatedWorkflowHash: true,
        status: true,
      }),
      translatedNodes: TranslatedNamesSchema,
      credentials: z
        .array(CredentialInfoSchema)
        .describe('Uma lista de credenciais identificadas no workflow.'),
    }),
  },
  prompt: `Você é um especialista em n8n e automação de processos de negócios. Sua tarefa é analisar o JSON de um workflow do n8n, extrair informações importantes, traduzir os nomes dos nós e identificar as credenciais utilizadas.

Analise o seguinte workflow:
\`\`\`json
{{{workflowJson}}}
\`\`\`

Tarefas:
1.  **Análise de Metadados:**
    *   **Nome:** Crie um nome curto, específico e objetivo para o workflow (máximo 60 caracteres). Evite termos genéricos como "Automação" ou "Workflow". Exemplo: "Sincronizar Pedidos do Stripe com Notion".
    *   **Descrição:** Escreva uma descrição concisa e de alto nível, focada no objetivo e no resultado final do workflow. Ideal para um usuário final entender o valor da automação.
    *   **Categoria:** Com base na funcionalidade geral do workflow e nos nomes dos nós ([{{#each nodeNames}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}]), classifique-o em uma das seguintes categorias funcionais: [{{{categories}}}]. Se nenhuma categoria se encaixar perfeitamente, crie uma nova categoria que seja específica e apropriada.
    *   **Nicho de Mercado:** Identifique o nicho de mercado ou área de negócio principal para o qual este workflow é mais útil (ex: "Médico", "Advocacia", "Delivery", "E-commerce", "Imobiliário", "Agência de Marketing"). Seja específico. Se for genérico, use "Produtividade Pessoal".
    *   **Plataformas:** Identifique e liste as principais plataformas, aplicativos ou serviços que são integrados neste workflow (ex: "Notion", "Google Sheets", "Stripe", "Slack").
    *   **Explicação:** Gere uma explicação técnica detalhada, em português, de como o workflow funciona. Descreva cada passo (nó), o que ele faz, e como os dados fluem através do processo. Esta explicação será usada como uma documentação técnica interna ou um "bloco de notas" para desenvolvedores. No final da explicação, adicione em uma nova linha o texto "Para mais automações, siga: instagram.com/kds_brasil".

2.  **Identificação de Credenciais:**
    *   Inspecione cada nó no JSON do workflow.
    *   Identifique os nós que utilizam uma credencial REAL para autenticação.
    *   O critério para uma credencial real é a existência de um valor de placeholder que comece **especificamente com \`{{$credentials\`** dentro das propriedades do nó. Ignore quaisquer outras expressões ou referências a outros nós (como \`{{$node...}}\`).
    *   Para cada credencial encontrada:
        1.  Extraia o **nome da credencial** (o valor associado à chave 'credential' dentro do objeto de credenciais, ex: "Google Gemini(PaLM) Api account").
        2.  Extraia a **plataforma** (o tipo do nó, ex: 'n8n-nodes-base.googleSheets').
        3.  Extraia o **valor placeholder** exato (ex: \`{{$credentials.googleApi.apiKey}}\`). O valor não pode estar em branco.
    *   Retorne uma lista de objetos, cada um contendo 'platforma', 'credencial' e 'value'.

3.  **Tradução dos Nomes dos Nós:**
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
    let workflow;
    const originalJson = input.workflowJson;
    try {
      const cleanedJson = originalJson.trim().replace(/^\uFEFF/, '');
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

    const nodeNamesToTranslate = workflow.nodes
      .map((node: any) => node.name)
      .filter((name: any) => typeof name === 'string' && name.trim() !== '');

    const analysisOptions: {
      model?: any;
      config?: {apiKey?: string};
    } = {};

    if (input.apiKey) {
      analysisOptions.model = googleAI.model(
        'gemini-1.5-pro-latest'
      );
      analysisOptions.config = {apiKey: input.apiKey};
    } else {
      analysisOptions.model = googleAI.model('gemini-1.5-flash');
    }

    const {output} = await analysisPrompt(
      {
        workflowJson: originalJson,
        categories: categories,
        nodeNames: nodeNamesToTranslate,
      },
      analysisOptions
    );

    if (!output || !output.analysis || !output.translatedNodes) {
      throw new Error('A IA não conseguiu analisar o workflow completamente.');
    }

    const {
      analysis: analysisResult,
      translatedNodes,
      credentials,
    } = output;

    // Save credentials to the database in the background (fire and forget)
    if (credentials && credentials.length > 0) {
      credentials.forEach((cred) => {
        saveCredential({
          ...cred,
          templateName: analysisResult.name, // Use the name generated by the AI
        }).catch((err) => console.error('Failed to save credential:', err));
      });
    }

    const translationMap = new Map(
      translatedNodes.translations.map((t) => [t.original, t.translated])
    );
    
    // Translate connections
    if (workflow.connections && typeof workflow.connections === 'object') {
        const originalConnections = JSON.parse(JSON.stringify(workflow.connections));
        const updatedConnections: Record<string, any> = {};

        for (const sourceNodeName in originalConnections) {
            const translatedSource = translationMap.get(sourceNodeName) || sourceNodeName;
            const sourceOutputs = originalConnections[sourceNodeName];
            
            if (!updatedConnections[translatedSource]) {
                updatedConnections[translatedSource] = {};
            }

            for (const outputName in sourceOutputs) {
                const destinationGroups = sourceOutputs[outputName];
                updatedConnections[translatedSource][outputName] = destinationGroups.map((group: any) => ({
                    ...group,
                    node: translationMap.get(group.node) || group.node,
                }));
            }
        }
        workflow.connections = updatedConnections;
    }


    let minX = Infinity;
    let minY = Infinity;

    workflow.nodes.forEach((node: any) => {
      if (node.name && translationMap.has(node.name)) {
        node.name = translationMap.get(node.name);
      }
      if (node.position) {
        if (node.position[0] < minX) minX = node.position[0];
        if (node.position[1] < minY) minY = node.position[1];
      }
    });

    const stickyNote = {
      parameters: {
        content: analysisResult.explanation,
        height: 400,
        width: 500,
      },
      id: `sticky-note-${Date.now()}`,
      name: 'Explicação do Workflow',
      type: 'n8n-nodes-base.stickyNote',
      typeVersion: 1,
      position: [minX - 550, minY],
    };

    workflow.nodes.push(stickyNote);

    const translatedWorkflowJson = JSON.stringify(workflow, null, 2);

    const originalWorkflowHash = createHash('sha256').update(originalJson).digest('hex');
    const translatedWorkflowHash = createHash('sha256').update(translatedWorkflowJson).digest('hex');

    return {
      ...analysisResult,
      status: 'PROCESSED',
      translatedWorkflowJson,
      originalWorkflowHash,
      translatedWorkflowHash,
    };
  }
);

    