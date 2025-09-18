'use server';

/**
 * @fileOverview Summarizes bot logs to provide a quick understanding of bot activity.
 *
 * - summarizeBotLogs - A function that takes bot logs as input and returns a summarized version.
 * - SummarizeBotLogsInput - The input type for the summarizeBotLogs function.
 * - SummarizeBotLogsOutput - The return type for the summarizeBotLogs function.
 */

import {ai} from '@/lib/genkit/genkit';
import {z} from 'genkit';

const SummarizeBotLogsInputSchema = z.object({
  botLogs: z
    .string()
    .describe('The complete logs of the bot execution.'),
});
export type SummarizeBotLogsInput = z.infer<typeof SummarizeBotLogsInputSchema>;

const SummarizeBotLogsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the bot logs.'),
});
export type SummarizeBotLogsOutput = z.infer<typeof SummarizeBotLogsOutputSchema>;

export async function summarizeBotLogs(input: SummarizeBotLogsInput): Promise<SummarizeBotLogsOutput> {
  return summarizeBotLogsFlow(input);
}

const summarizeBotLogsPrompt = ai.definePrompt({
  name: 'summarizeBotLogsPrompt',
  input: {schema: SummarizeBotLogsInputSchema},
  output: {schema: SummarizeBotLogsOutputSchema},
  prompt: `You are an expert at summarizing bot logs.

  Please provide a concise summary of the following bot logs:

  {{botLogs}}
  `,
});

const summarizeBotLogsFlow = ai.defineFlow(
  {
    name: 'summarizeBotLogsFlow',
    inputSchema: SummarizeBotLogsInputSchema,
    outputSchema: SummarizeBotLogsOutputSchema,
  },
  async input => {
    const {output} = await summarizeBotLogsPrompt(input);
    return output!;
  }
);
