'use server';
/**
 * @fileOverview Um agente de IA para processar e enriquecer workflows do n8n.
 *
 * - processWorkflow - Uma função que analisa um workflow n8n e extrai metadados.
 */

import {ai} from '@/ai/genkit';
import {
  ProcessWorkflowInput,
  ProcessWorkflowInputSchema,
  ProcessWorkflowOutput,
  ProcessWorkflowOutputSchema,
} from './workflow-types';
import {translateText} from './translate-text';

export async function processWorkflow(
  input: ProcessWorkflowInput
): Promise<ProcessWorkflowOutput> {
  return processWorkflowFlow(input);
}

const analysisPrompt = ai.definePrompt({
  name: 'processWorkflowAnalysisPrompt',
  input: {
    schema: z.object({
      workflowJson: z.string(),
      categories: z.array(z.string()),
    }),
  },
  output: {
    schema: ProcessWorkflowOutputSchema.omit({translatedWorkflowJson: true}),
  },
  prompt: `Você é um especialista em n8n e automação de processos. Sua tarefa é analisar o JSON de um workflow do n8n e extrair informações importantes.

Analise o seguinte workflow:
\`\`\`json
{{{workflowJson}}}
\`\`\`

Tarefas:
1.  **Nome:** Crie um nome curto, específico e objetivo para o workflow (máximo 50 caracteres). Evite termos genéricos como "Automação" ou "Workflow". Exemplo: "Sincronizar Pedidos do Stripe com Notion".
2.  **Descrição:** Escreva uma descrição concisa e de alto nível, focada no objetivo e no resultado final do workflow. Ideal para um usuário final entender o valor da automação.
3.  **Categoria:** Analise o workflow e o classifique em uma das seguintes categorias: [{{{categories}}}]. Se nenhuma categoria se encaixar perfeitamente, crie uma nova categoria que seja específica e apropriada.
4.  **Plataformas:** Identifique e liste as principais plataformas, aplicativos ou serviços que são integrados neste workflow (ex: "Notion", "Google Sheets", "Stripe", "Slack").
5.  **Explicação:** Gere uma explicação técnica detalhada, em português, de como o workflow funciona. Descreva cada passo (nó), o que ele faz, e como os dados fluem através do processo. Esta explicação será usada como uma documentação técnica interna ou um "bloco de notas" para desenvolvedores.
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
      workflow = JSON.parse(input.workflowJson);
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

    // 2. Run the analysis prompt to get metadata
    const {output: analysisResult} = await analysisPrompt({
      workflowJson: input.workflowJson,
      categories: categories,
    });

    if (!analysisResult) {
      throw new Error('A IA não conseguiu analisar o workflow.');
    }

    // 3. Translate each node name
    const translationPromises = workflow.nodes.map(async (node: any) => {
      if (node.name) {
        const translatedName = await translateText(node.name);
        return {...node, name: translatedName};
      }
      return node;
    });

    const translatedNodes = await Promise.all(translationPromises);
    workflow.nodes = translatedNodes;

    // 4. Stringify the modified workflow
    const translatedWorkflowJson = JSON.stringify(workflow, null, 2);

    // 5. Return the combined result
    return {
      ...analysisResult,
      translatedWorkflowJson,
    };
  }
);
