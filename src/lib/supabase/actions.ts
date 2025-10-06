
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/supabase/auth';
import { deployBotToBackend, deleteBotFromBackend, startBotInBackend, stopBotInBackend } from '@/lib/bot-backend/client';
import { revalidatePath } from 'next/cache';
import { paddle } from '@/lib/paddle/client';

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

// This is the new subscription fetching logic.
export async function getUserSubscription(userId: string) {
  const supabase = createSupabaseServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('paddle_customer_id')
    .eq('id', userId)
    .single();

  if (!profile || !profile.paddle_customer_id) {
    return { plan: 'Free', paddle_customer_id: null };
  }

  try {
    const subscriptions = paddle.subscriptions.list({
      customerId: [profile.paddle_customer_id],
      status: ['active'],
    });

    for await (const subscription of subscriptions) {
        const planItem = subscription.items.find((item) => item.price?.type === 'recurring');
        if (planItem?.price?.id) {
             if (planItem.price.id === process.env.NEXT_PUBLIC_PADDLE_PRO_PLAN_ID) {
                return { plan: 'Pro', paddle_customer_id: profile.paddle_customer_id };
            }
            if (planItem.price.id === process.env.NEXT_PUBLIC_PADDLE_POWER_PLAN_ID) {
                return { plan: 'Power', paddle_customer_id: profile.paddle_customer_id };
            }
        }
    }
  } catch (error) {
    console.error("Error fetching subscription from Paddle:", error);
    // If Paddle API fails, default to Free to prevent locking user out.
    return { plan: 'Free', paddle_customer_id: profile.paddle_customer_id };
  }

  // If no active subscription found in Paddle, they are on the Free plan.
  return { plan: 'Free', paddle_customer_id: profile.paddle_customer_id };
}


export async function upsertUserProfile({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error('Supabase admin client not initialized.');
  }

  const profileData = {
    id: userId,
    email: email,
    updated_at: new Date().toISOString(),
  };

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

export async function updateUserPlan({ 
    userId,
    paddle_customer_id 
}: { 
    userId: string,
    paddle_customer_id: string | null
}) {
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
        console.error('[updateUserPlan] - Supabase admin client not initialized. Check service role key.');
        throw new Error('Supabase admin client not initialized.');
    }
    
    // First, ensure a profile exists. The auth callback should have created it.
    const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

    if (profileError && !existingProfile) {
        // If the profile doesn't exist (e.g., webhook fired before user signed in fully), create it.
        const placeholderEmail = `${userId}@placeholder.botoralo.app`;
        const { error: newProfileError } = await supabase
            .from('profiles')
            .insert({ 
                id: userId, 
                email: placeholderEmail, 
                updated_at: new Date().toISOString(),
                paddle_customer_id: paddle_customer_id,
            });

        if (newProfileError) {
            console.error(`[updateUserPlan] - CRITICAL: Error creating placeholder profile for ${userId}:`, JSON.stringify(newProfileError, null, 2));
            throw new Error('Could not create placeholder user profile.');
        }
        console.log(`[updateUserPlan] - Created placeholder profile for new user ${userId}.`);
    } else {
        // If profile exists, just update the customer ID.
        const updateData = { 
            paddle_customer_id,
            updated_at: new Date().toISOString()
        };
        
        console.log(`[updateUserPlan] - Attempting to update profile ${userId} with data:`, JSON.stringify(updateData, null, 2));

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId);
        
        if (error) {
            console.error('[updateUserPlan] - CRITICAL: Error updating user plan with admin client:', JSON.stringify(error, null, 2));
            throw new Error('Could not update user plan in database.');
        }
        console.log(`[updateUserPlan] - Successfully updated customer ID for ${userId}.`);
    }
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
    // If deployment fails, we should delete the bot record to avoid orphaned entries
    await supabase.from('bots').delete().eq('id', newBot.id);
    throw new Error(`Bot deployment failed: ${(backendError as Error).message}`);
  }


  revalidatePath('/dashboard');
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

export async function startBot(prevState: any, formData: FormData) {
    const botId = formData.get('botId') as string;
    try {
        await startBotInBackend(botId);
        const supabase = createSupabaseServerClient();
        await supabase.from('bots').update({ status: 'running' }).eq('id', botId);
        revalidatePath(`/dashboard/bots/${botId}`);
        revalidatePath('/dashboard');
        return { message: "Bot is starting...", success: true };
    } catch (e) {
        return { message: (e as Error).message, success: false };
    }
}

export async function stopBot(prevState: any, formData: FormData) {
    const botId = formData.get('botId') as string;
    try {
        await stopBotInBackend(botId);
        const supabase = createSupabaseServerClient();
        await supabase.from('bots').update({ status: 'stopped' }).eq('id', botId);
        revalidatePath(`/dashboard/bots/${botId}`);
        revalidatePath('/dashboard');
        return { message: "Bot is stopping...", success: true };
    } catch(e) {
        return { message: (e as Error).message, success: false };
    }
}

export async function deleteBot(prevState: any, formData: FormData) {
    const botId = formData.get('botId') as string;
    const supabase = createSupabaseServerClient();
    
    try {
        const { error: dbError } = await supabase.from('bots').delete().eq('id', botId);

        if (dbError) {
            console.error("Failed to delete bot from Supabase:", dbError);
            throw new Error("Could not delete bot from the database.");
        }

        await deleteBotFromBackend(botId);
        revalidatePath('/dashboard');
        return { message: "Bot has been deleted.", success: true };
    } catch (e) {
        console.warn(`Could not delete bot ${botId} from backend service. It may have already been deleted from the database.`, e);
        // Still return success if DB deletion worked, as it's the source of truth.
        revalidatePath('/dashboard');
        return { message: (e as Error).message, success: false };
    }
}
