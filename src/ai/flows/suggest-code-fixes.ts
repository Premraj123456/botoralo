'use server';

/**
 * @fileOverview Analyzes bot logs and suggests code fixes for common errors.
 *
 * - suggestCodeFixes - A function that takes bot logs as input and returns code fix suggestions.
 * - SuggestCodeFixesInput - The input type for the suggestCodeFixes function.
 * - SuggestCodeFixesOutput - The return type for the suggestCodeFixes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCodeFixesInputSchema = z.object({
  botLogs: z
    .string()
    .describe('The logs from the bot execution, including any error messages.'),
  botCode: z
    .string()
    .describe('The code of the bot. Required for suggesting fixes that integrate with the code itself.'),
});
export type SuggestCodeFixesInput = z.infer<typeof SuggestCodeFixesInputSchema>;

const SuggestCodeFixesOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      errorType: z.string().describe('The type of error identified in the logs.'),
      errorMessage: z.string().describe('The specific error message from the logs.'),
      codeFixSuggestion: z.string().describe('A code snippet or description of how to fix the error.'),
      severity: z.enum(['low', 'medium', 'high']).describe('The severity of the error.'),
    })
  ).describe('An array of code fix suggestions.'),
});
export type SuggestCodeFixesOutput = z.infer<typeof SuggestCodeFixesOutputSchema>;

export async function suggestCodeFixes(input: SuggestCodeFixesInput): Promise<SuggestCodeFixesOutput> {
  return suggestCodeFixesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCodeFixesPrompt',
  input: {schema: SuggestCodeFixesInputSchema},
  output: {schema: SuggestCodeFixesOutputSchema},
  prompt: `You are an AI expert in debugging and improving bot code.

You will analyze the provided bot logs and suggest code fixes for common errors.
Consider the provided bot code when creating suggestions.

Logs:
{{botLogs}}

Code:
{{botCode}}

Provide your suggestions in the following format:

[
  {
    "errorType": "The type of error (e.g., SyntaxError, TypeError)",
    "errorMessage": "The specific error message from the logs.",
    "codeFixSuggestion": "A code snippet or a detailed description of how to fix the error.  Be specific.",
    "severity": "low | medium | high"
  },
  ...
]
`,
});

const suggestCodeFixesFlow = ai.defineFlow(
  {
    name: 'suggestCodeFixesFlow',
    inputSchema: SuggestCodeFixesInputSchema,
    outputSchema: SuggestCodeFixesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
