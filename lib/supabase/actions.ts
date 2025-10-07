
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/supabase/auth';
import { deployBotToBackend, deleteBotFromBackend, startBotInBackend, stopBotInBackend } from '@/lib/bot-backend/client';
import { revalidatePath } from 'next/cache';
import { Paddle, Subscription } from '@paddle/paddle-node-sdk';

// This file is NOT a server action file. It is a server-side utility.
// Initialize Paddle with the correct environment setting
const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: process.env.NODE_ENV === 'development' ? 'sandbox' : 'production',
});


const planLimits = {
  Free: 1,
  PRO: 5,
  POWER: 20,
};

export type Bot = {
  id: string;
  created_at: string;
  name: string;
  owner_id: string;
  status: 'running' | 'stopped' | 'error';
};

// This is the new subscription fetching logic.
export async function getUserSubscription() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    console.log('[getUserSubscription] - No authenticated user or email found. Defaulting to Free plan.');
    return { plan: 'Free', paddle_customer_id: null };
  }

  const userEmail = user.email;
  console.log(`[getUserSubscription] - Found authenticated user email: ${userEmail}`);

  try {
    // 1. Find customer by email
    console.log(`[getUserSubscription] - Searching for Paddle customer with email: ${userEmail}`);
    const customers = await paddle.customers.list({ email: userEmail });
    
    let customer = null;
    for await (const c of customers) {
      customer = c;
      break; 
    }

    if (!customer) {
      console.log('[getUserSubscription] - No Paddle customer found for this email. Defaulting to Free plan.');
      return { plan: 'Free', paddle_customer_id: null };
    }

    const customerId = customer.id;
    console.log(`[getUserSubscription] - Found Paddle customer ID: ${customerId}`);

    // 2. Find active subscriptions for that customer
    console.log(`[getUserSubscription] - Searching for active subscriptions for customer ID: ${customerId}`);
    const subscriptions = paddle.subscriptions.list({
      customerId: [customerId],
      status: ['active'],
    });

    const activeSubscriptions: Subscription[] = [];
    for await (const subscription of subscriptions) {
      activeSubscriptions.push(subscription);
    }
    
    if (activeSubscriptions.length === 0) {
        console.log('[getUserSubscription] - No active subscriptions found. Defaulting to Free plan.');
        return { plan: 'Free', paddle_customer_id: customerId };
    }

    activeSubscriptions.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    const latestSubscriptionFromList = activeSubscriptions[0];
    console.log(`[getUserSubscription] - Found ${activeSubscriptions.length} active subscriptions. Selecting the latest one: ${latestSubscriptionFromList.id}`);
    
    // 3. Get full details for the latest subscription to ensure product data is present
    console.log(`[getUserSubscription] - Fetching full details for subscription ${latestSubscriptionFromList.id}`);
    const latestSubscription = await paddle.subscriptions.get(latestSubscriptionFromList.id, { include: ['product'] });
    
    if (!latestSubscription) {
        console.error(`[getUserSubscription] - CRITICAL: Could not fetch details for subscription ${latestSubscriptionFromList.id}. Defaulting to Free plan.`);
        return { plan: 'Free', paddle_customer_id: customerId };
    }

    for (const planItem of latestSubscription.items) {
        // The product info is now directly included
        if (planItem.product?.name) {
            const productName = (planItem.product.name || '').toLowerCase();
            console.log(`[getUserSubscription] - Found Product Name: "${productName}"`);

            if (productName.includes('power')) {
                console.log('[getUserSubscription] - Matched Power Plan. Returning "POWER".');
                return { plan: 'POWER', paddle_customer_id: customerId };
            }
            if (productName.includes('pro')) {
                console.log('[getUserSubscription] - Matched Pro Plan. Returning "PRO".');
                return { plan: 'PRO', paddle_customer_id: customerId };
            }
        }
    }
    
    console.log('[getUserSubscription] - No active Pro or Power subscription found among items. Defaulting to Free plan.');
    return { plan: 'Free', paddle_customer_id: customerId };

  } catch (error) {
    console.error("[getUserSubscription] - Error fetching subscription from Paddle:", error);
    return { plan: 'Free', paddle_customer_id: null };
  }
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
    // If profile doesn't exist, we can still return basic info
    return {
      id: user.id,
      email: user.email ?? null,
      full_name: null,
      updated_at: null,
    };
  }

  // Ensure the email is always fresh from the auth user
  if (data) {
    data.email = user.email ?? data.email;
  }

  return data;
}

export async function updateUserProfile(data: { name: string }) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: data.name, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error("Error updating profile:", error.message);
    throw new Error('Failed to update profile.');
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}


// --- BOT ACTIONS ---

export async function createBot(formData: FormData) {
  const { user } = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const name = formData.get('name') as string;
  const codeFile = formData.get('codeFile') as File;

  if (!name || !codeFile) {
    throw new Error("Bot name and code file are required.");
  }

  const supabase = createSupabaseServerClient();

  const [subscription, { count }] = await Promise.all([
    getUserSubscription(),
    supabase.from('bots').select('*', { count: 'exact', head: true }).eq('owner_id', user.id)
  ]);

  const botLimit = planLimits[subscription.plan as keyof typeof planLimits] ?? 1;
  const currentBotCount = count ?? 0;

  if (currentBotCount >= botLimit) {
    throw new Error(`You have reached your bot limit for the ${subscription.plan} plan. Please upgrade your plan to create more bots.`);
  }

  // Insert a record into the DB first to get an ID
  const { data: newBot, error } = await supabase
    .from('bots')
    .insert({
      name: name,
      owner_id: user.id,
      status: 'stopped',
    })
    .select('id, name, owner_id, status, created_at')
    .single();

  if (error) {
    console.error('Error creating bot in database:', error);
    throw new Error('Failed to create bot in database.');
  }
  
  try {
    await deployBotToBackend(newBot, codeFile);
    await supabase.from('bots').update({ status: 'running' }).eq('id', newBot.id);
  } catch (backendError) {
    console.error("Backend deployment failed:", backendError);
    // Rollback: delete the bot record from Supabase if backend fails
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
    .select('id, name, status, owner_id, created_at')
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
    .select('id, name, status, owner_id, created_at')
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
        // If the backend delete fails, we should still proceed as the DB record is gone.
        // The container might be orphaned, but it's better than blocking the user.
        console.warn(`Could not delete bot ${botId} from backend service. It may have already been deleted or orphaned.`, e);
        revalidatePath('/dashboard');
        return { message: "Bot has been deleted from the dashboard.", success: true };
    }
}

    