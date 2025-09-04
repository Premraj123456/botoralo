import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-bot-logs.ts';
import '@/ai/flows/alert-on-anomalous-events.ts';
import '@/ai/flows/suggest-code-fixes.ts';