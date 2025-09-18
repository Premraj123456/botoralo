
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { deployBotToBackend, deleteBotFromBackend, startBotInBackend, stopBotInBackend } from '@/lib/bot-backend/client';
import { revalidatePath } from 'next/cache';

const planLimits = {
  Free: 1,
  Pro: 5,
  Power: 20,
};

export type Bot = {
  id: string;
  created_at: string;
  name: string;
  code: string;
  owner_id: string;
  status: 'running' | 'stopped' | 'error';
};

export async function getUserSubscription(userId: string) {
  try {
    const supabase = createSupabaseServerClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, paypal_subscription_id')
      .eq('id', userId)
      .single();
      
    if (!profile) {
      console.log(`No profile found for user ${userId}. Defaulting to Free plan.`);
      return { plan: 'Free', subscriptionId: null };
    }
    
    return { plan: profile.plan || 'Free', subscriptionId: profile.paypal_subscription_id };
  } catch (error) {
    console.error("Error getting user subscription:", (error as Error).message);
    return { plan: 'Free', subscriptionId: null };
  }
}


export async function upsertUserProfile({
  userId,
  email,
  subscriptionId,
  plan,
}: {
  userId: string;
  email: string;
  subscriptionId?: string;
  plan?: string;
}) {
  const supabase = createSupabaseServerClient();

  const profileData: {
    id: string;
    email: string;
    paypal_subscription_id?: string;
    plan?: string;
  } = {
    id: userId,
    email: email,
  };

  if (subscriptionId) profileData.paypal_subscription_id = subscriptionId;
  if (plan) profileData.plan = plan;


  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user profile:', error);
    throw new Error('Could not upsert user profile.');
  }
  return data;
}

export async function updateUserPlan({ userId, plan, subscriptionId }: { userId: string, plan: string, subscriptionId: string | null }) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
        .from('profiles')
        .update({ plan, paypal_subscription_id: subscriptionId })
        .eq('id', userId);
    
    if (error) {
        console.error('Error updating user plan:', error);
        throw new Error('Could not update user plan.');
    }
    console.log(`Successfully updated plan for ${userId} to ${plan}`);
}


export async function getUserProfile() {
  const { user } = await getCurrentUser();
  if (!user) return null;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error.message);
    return null;
  }

  return data;
}

export async function updateUserProfile(data: { name: string }) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: data.name })
    .eq('id', user.id);

  if (error) {
    console.error("Error updating profile:", error.message);
    throw new Error('Failed to update profile.');
  }

  return { success: true };
}


// --- BOT ACTIONS ---

export async function createBot(data: { name: string, code: string }) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createSupabaseServerClient();

  const [subscription, { count }] = await Promise.all([
    getUserSubscription(user.id),
    supabase.from('bots').select('*', { count: 'exact', head: true }).eq('owner_id', user.id)
  ]);

  const botLimit = planLimits[subscription.plan as keyof typeof planLimits] ?? 1;
  const currentBotCount = count ?? 0;

  if (currentBotCount >= botLimit) {
    throw new Error(`You have reached your bot limit for the ${subscription.plan} plan. Please upgrade your plan to create more bots.`);
  }


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
  
  try {
    await deployBotToBackend(newBot as Bot);
    await supabase.from('bots').update({ status: 'running' }).eq('id', newBot.id);
  } catch (backendError) {
    console.error("Backend deployment failed:", backendError);
    throw new Error(`Bot created, but failed to deploy: ${(backendError as Error).message}`);
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

export async function getBotById(botId: string): Promise<Bot | null> {
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

export async function startBot(botId: string) {
    await startBotInBackend(botId);
    const supabase = createSupabaseServerClient();
    await supabase.from('bots').update({ status: 'running' }).eq('id', botId);
    revalidatePath(`/dashboard/bots/${botId}`);
}

export async function stopBot(botId: string) {
    await stopBotInBackend(botId);
    const supabase = createSupabaseServerClient();
    await supabase.from('bots').update({ status: 'stopped' }).eq('id', botId);
    revalidatePath(`/dashboard/bots/${botId}`);
}

export async function deleteBot(botId: string) {
    const supabase = createSupabaseServerClient();
    
    const { error: dbError } = await supabase.from('bots').delete().eq('id', botId);

    if (dbError) {
        console.error("Failed to delete bot from Supabase:", dbError);
        throw new Error("Could not delete bot from the database.");
    }

    try {
        await deleteBotFromBackend(botId);
    } catch (backendError) {
        console.warn(`Could not delete bot ${botId} from backend service. It was already deleted from the database.`, backendError);
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/bots/${botId}`);
}
