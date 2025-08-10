'use server';
/**
 * @fileOverview Fluxo de tradução de texto.
 *
 * - translateText - Traduz um texto para o português do Brasil.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.string().describe('Texto a ser traduzido.');
const TranslateTextOutputSchema = z.string().describe('Texto traduzido para o português do Brasil.');

const translatePrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Traduza o seguinte texto para o português do Brasil. Retorne apenas a tradução, sem qualquer outra formatação ou texto adicional.

Texto original: "{{{input}}}"
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (text) => {
    if (!text) {
      return '';
    }
    const {output} = await translatePrompt(text);
    return output || text; // Retorna o texto original se a tradução falhar
  }
);

export async function translateText(text: string): Promise<string> {
  return translateTextFlow(text);
}
