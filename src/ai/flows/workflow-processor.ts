'use server';
/**
 * @fileOverview Um agente de IA para processar e enriquecer workflows do n8n.
 *
 * - processWorkflow - Uma função que analisa um workflow n8n e extrai metadados.
 * - ProcessWorkflowInput - O tipo de entrada para a função processWorkflow.
 * - ProcessWorkflowOutput - O tipo de retorno para a função processWorkflow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const ProcessWorkflowInputSchema = z.object({
  workflowJson: z.string().describe('O conteúdo JSON de um workflow do n8n.'),
});
export type ProcessWorkflowInput = z.infer<typeof ProcessWorkflowInputSchema>;

export const ProcessWorkflowOutputSchema = z.object({
  name: z.string().describe('O nome do workflow.'),
  description: z.string().describe('Uma descrição clara e concisa do que o workflow faz.'),
  category: z.string().describe('A categoria principal do workflow (ex: Marketing, Vendas, Produtividade).'),
  platforms: z.array(z.string()).describe('Uma lista das principais plataformas ou aplicativos que o workflow integra (ex: Notion, Google Sheets, Slack).'),
  explanation: z.string().describe('Uma explicação detalhada, passo a passo, de como o workflow funciona, para ser usada como documentação interna.'),
});
export type ProcessWorkflowOutput = z.infer<typeof ProcessWorkflowOutputSchema>;

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
1.  **Nome:** Extraia ou crie um nome claro e descritivo para o workflow.
2.  **Descrição:** Escreva uma descrição concisa e amigável para o usuário final, explicando o que o workflow faz.
3.  **Categoria:** Classifique o workflow em uma categoria principal (ex: Marketing, Vendas, Produtividade, Finanças, RH, IT).
4.  **Plataformas:** Identifique e liste as principais plataformas, aplicativos ou serviços que são integrados neste workflow (ex: "Notion", "Google Sheets", "Stripe", "Slack").
5.  **Explicação:** Gere uma explicação técnica detalhada, em português, de como o workflow funciona. Descreva cada passo (nó), o que ele faz, e como os dados fluem através do processo. Esta explicação será usada como um bloco de notas ou documentação para outros desenvolvedores ou usuários avançados.
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
