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
  apiKey: z.string().optional().describe('Chave de API opcional do Google AI para usar um modelo mais poderoso.'),
});
export type ProcessWorkflowInput = z.infer<typeof ProcessWorkflowInputSchema>;

export const ProcessWorkflowOutputSchema = z.object({
  name: z.string().describe('O nome do workflow.'),
  description: z.string().describe('Uma descrição clara e concisa do que o workflow faz.'),
  category: z.string().describe('A categoria principal do workflow (ex: Marketing, Vendas, Produtividade).'),
  niche: z.string().describe('O nicho de mercado principal para o qual o workflow é útil (ex: Médico, Advocacia, E-commerce).'),
  platforms: z.array(z.string()).describe('Uma lista das principais plataformas ou aplicativos que o workflow integra (ex: Notion, Google Sheets, Slack).'),
  explanation: z.string().describe('Uma explicação detalhada, passo a passo, de como o workflow funciona, para ser usada como documentação interna.'),
  translatedWorkflowJson: z.string().describe('O workflow JSON completo com os nomes dos nós traduzidos para o português.'),
  originalWorkflowHash: z.string().describe('O hash SHA256 do JSON do workflow original.'),
  translatedWorkflowHash: z.string().describe('O hash SHA256 do JSON do workflow traduzido.'),
  status: z.enum(['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED']).describe('O status do processamento do workflow.'),
});
export type ProcessWorkflowOutput = z.infer<typeof ProcessWorkflowOutputSchema>;


export const CredentialInfoSchema = z.object({
  platform: z.string().describe("A plataforma ou tipo de nó que usa a credencial (ex: 'n8n-nodes-base.googleSheets')."),
  credential: z.string().describe("O nome da credencial usada (ex: 'My Google API')."),
});
export type CredentialInfo = z.infer<typeof CredentialInfoSchema>;

export const StoredCredentialSchema = CredentialInfoSchema.extend({
  id: z.string(),
  templateName: z.string().describe("O nome do template onde a credencial foi encontrada."),
  createdAt: z.string(),
});
export type StoredCredential = z.infer<typeof StoredCredentialSchema>;
