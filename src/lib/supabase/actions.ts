'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';

// --- BOT ACTIONS ---

export async function createBot(data: { name: string, code: string }) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createSupabaseServerClient();
  const { data: newBot, error } = await supabase
    .from('bots')
    .insert({
      name: data.name,
      code: data.code,
      owner_id: user.id,
      status: 'stopped',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating bot:', error);
    throw new Error('Failed to create bot in database.');
  }

  return newBot;
}

export async function getUserBots() {
  const { user } = await getCurrentUser();
  if (!user) return [];
  
  const supabase = createSupabaseServerClient();
  const { data: bots, error } = await supabase
    .from('bots')
    .select('*')
    .eq('owner_id', user.id);

  if (error) {
    console.error("Error fetching user bots from Supabase:", error);
    return [];
  }

  return bots || [];
}

export async function getBotById(botId: string) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  
  const supabase = createSupabaseServerClient();
  const { data: bot, error } = await supabase
    .from('bots')
    .select('*')
    .eq('id', botId)
    .single();

  if (error) {
    console.error(`Error fetching bot ${botId}:`, error);
    return null;
  }
  
  if (bot && bot.owner_id !== user.id) {
    throw new Error('Not authorized to view this bot.');
  }
  
  return bot;
}
