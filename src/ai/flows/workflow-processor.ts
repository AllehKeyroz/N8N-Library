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

export async function processWorkflow(input: ProcessWorkflowInput): Promise<ProcessWorkflowOutput> {
  return processWorkflowFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processWorkflowPrompt',
  input: {schema: ProcessWorkflowInputSchema},
  output: {schema: ProcessWorkflowOutputSchema},
  prompt: `Você é um especialista em n8n e automação de processos. Sua tarefa é analisar o JSON de um workflow do n8n e extrair informações importantes.

Analise o seguinte workflow:
\`\`\`json
{{{workflowJson}}}
\`\`\`

Tarefas:
1.  **Nome:** Crie um nome curto, específico e objetivo para o workflow (máximo 50 caracteres). Evite termos genéricos como "Automação" ou "Workflow". Exemplo: "Sincronizar Pedidos do Stripe com Notion".
2.  **Descrição:** Escreva uma descrição concisa e de alto nível, focada no objetivo e no resultado final do workflow. Ideal para um usuário final entender o valor da automação.
3.  **Categoria:** Classifique o workflow em uma categoria principal (ex: Marketing, Vendas, Produtividade, Finanças, RH, IT).
4.  **Plataformas:** Identifique e liste as principais plataformas, aplicativos ou serviços que são integrados neste workflow (ex: "Notion", "Google Sheets", "Stripe", "Slack").
5.  **Explicação:** Gere uma explicação técnica detalhada, em português, de como o workflow funciona. Descreva cada passo (nó), o que ele faz, e como os dados fluem através do processo. Esta explicação será usada como uma documentação técnica interna ou um "bloco de notas" para desenvolvedores.
6.  **Tradução do Workflow:** Analise o JSON do workflow fornecido. Para cada objeto dentro do array "nodes", traduza o valor da chave "name" para o português do Brasil. Retorne o JSON completo com essas traduções no campo "translatedWorkflowJson". Mantenha a estrutura do JSON intacta.
`,
});

const processWorkflowFlow = ai.defineFlow(
  {
    name: 'processWorkflowFlow',
    inputSchema: ProcessWorkflowInputSchema,
    outputSchema: ProcessWorkflowOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
