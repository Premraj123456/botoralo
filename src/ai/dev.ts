import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-bot-logs';
import '@/ai/flows/alert-on-anomalous-events';
import '@/ai/flows/suggest-code-fixes';
