/**
 * @fileOverview Tipos e esquemas para o processamento de workflows do n8n.
 *
 * - ProcessWorkflowInput - O tipo de entrada para a função processWorkflow.
 * - ProcessWorkflowOutput - O tipo de retorno para a função processWorkflow.
 * - ProcessWorkflowInputSchema - O esquema Zod para a entrada.
 * - ProcessWorkflowOutputSchema - O esquema Zod para a saída.
 */

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
