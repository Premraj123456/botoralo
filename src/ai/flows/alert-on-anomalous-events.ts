'use server';
/**
 * @fileOverview This file defines a Genkit flow to analyze bot logs and alert users to anomalous behavior.
 *
 * - analyzeLogsAndAlert - Analyzes bot logs for anomalies and triggers alerts.
 * - AnalyzeLogsInput - The input type for the analyzeLogsAndAlert function.
 * - AnalyzeLogsOutput - The return type for the analyzeLogsAndAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeLogsInputSchema = z.object({
  logs: z
    .string()
    .describe('The logs from the bot execution.')
    .min(1, 'Logs must be provided.'),
  botId: z.string().describe('The ID of the bot.'),
});
export type AnalyzeLogsInput = z.infer<typeof AnalyzeLogsInputSchema>;

const AnalyzeLogsOutputSchema = z.object({
  isAnomalous: z.boolean().describe('Whether anomalous behavior is detected.'),
  alertMessage: z
    .string()
    .describe('A message describing the anomalous behavior, if any.'),
});
export type AnalyzeLogsOutput = z.infer<typeof AnalyzeLogsOutputSchema>;

export async function analyzeLogsAndAlert(
  input: AnalyzeLogsInput
): Promise<AnalyzeLogsOutput> {
  return analyzeLogsAndAlertFlow(input);
}

const analyzeLogsPrompt = ai.definePrompt({
  name: 'analyzeLogsPrompt',
  input: {schema: AnalyzeLogsInputSchema},
  output: {schema: AnalyzeLogsOutputSchema},
  prompt: `You are an expert system administrator analyzing logs for anomalous behavior.

You will be provided with logs from a bot execution.
Your task is to determine if there is any anomalous behavior in the logs.
If there is, set isAnomalous to true and provide a descriptive alertMessage.
If not, set isAnomalous to false and leave alertMessage blank.

Bot ID: {{{botId}}}
Logs: {{{logs}}}

Consider the following as anomalous behavior:
- Unexpected errors or exceptions
- Sudden changes in resource usage (CPU, memory)
- Unusual network activity
- Security breaches or attempted breaches
- Unexpected bot termination or restarts
- Significant deviations from expected behavior
`,
});

const analyzeLogsAndAlertFlow = ai.defineFlow(
  {
    name: 'analyzeLogsAndAlertFlow',
    inputSchema: AnalyzeLogsInputSchema,
    outputSchema: AnalyzeLogsOutputSchema,
  },
  async input => {
    const {output} = await analyzeLogsPrompt(input);
    return output!;
  }
);
