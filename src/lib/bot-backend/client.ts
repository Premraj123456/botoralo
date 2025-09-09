
'use server';

import { getCurrentUser } from '@/lib/supabase/auth';
import type { Bot } from '@/lib/supabase/actions';
import { getBotById } from '@/lib/supabase/actions';

const BACKEND_URL = process.env.BOT_BACKEND_URL;
const MASTER_KEY = process.env.BOT_BACKEND_MASTER_KEY;

if (!BACKEND_URL || !MASTER_KEY) {
  console.warn("Bot backend URL or master key is not configured. Bot operations will be simulated.");
}

async function makeBackendRequest(endpoint: string, method: string, body: object) {
  if (!BACKEND_URL || !MASTER_KEY) {
    console.log(`Simulating backend request to ${endpoint} with method ${method}`, body);
    // Simulate a successful response in development if not configured
    return { success: true, data: { status: `simulated ${endpoint}` } };
  }

  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MASTER_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error(`Backend request failed: ${response.status}`, errorData);
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error("Error making backend request:", error);
    throw error;
  }
}


export async function deployBotToBackend(bot: Bot) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const payload = {
    userId: user.id,
    botoraloBotId: bot.id,
    name: bot.name,
    code: bot.code,
    auto_start: true, // Deploy and start immediately
  };
  return makeBackendRequest('/deploy', 'POST', payload);
}

export async function startBotInBackend(botId: string) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  
  const payload = { userId: user.id, botoraloBotId: botId };
  return makeBackendRequest('/start', 'POST', payload);
}

export async function stopBotInBackend(botId: string) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  
  const payload = { userId: user.id, botoraloBotId: botId };
  return makeBackendRequest('/stop', 'POST', payload);
}

export async function deleteBotFromBackend(botId: string) {
    const { user } = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const payload = { userId: user.id, botoraloBotId: botId };
    return makeBackendRequest('/delete', 'POST', payload);
}

export async function getBotInfoFromBackend(botId: string) {
    const { user } = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const payload = { userId: user.id, botoraloBotId: botId };
    try {
        const response = await makeBackendRequest('/info', 'POST', payload);
        return response.data;
    } catch (e) {
        // It's okay if info isn't found, might not be deployed yet
        return null;
    }
}
