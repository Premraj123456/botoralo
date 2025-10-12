
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { deployBotToBackend, deleteBotFromBackend, startBotInBackend, stopBotInBackend } from '@/lib/bot-backend/client';
import { revalidatePath } from 'next/cache';
import { Paddle, Subscription } from '@paddle/paddle-node-sdk';
import { redirect } from 'next/navigation';

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
  code: string;
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
    const latestSubscription = await paddle.subscriptions.get(latestSubscriptionFromList.id);
    
    if (!latestSubscription) {
        console.error(`[getUserSubscription] - CRITICAL: Could not fetch details for subscription ${latestSubscriptionFromList.id}. Defaulting to Free plan.`);
        return { plan: 'Free', paddle_customer_id: customerId };
    }

    for (const planItem of latestSubscription.items) {
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


  const { data: newBot, error } = await supabase
    .from('bots')
    .insert({
      name: name,
      owner_id: user.id,
      status: 'stopped',
    })
    .select()
    .select('id, created_at, name, status, owner_id ')
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
        await deleteBotFromBackend(botId);
    } catch (e) {
        console.warn(`Could not delete bot ${botId} from backend service, but proceeding with DB deletion. It may have already been deleted or orphaned.`, e);
    }

    const { error: dbError } = await supabase.from('bots').delete().eq('id', botId);

    if (dbError) {
        console.error("Failed to delete bot from Supabase:", dbError);
        return { message: "Could not delete bot from the database.", success: false };
    }
    
    revalidatePath('/dashboard');
    return { message: "Bot has been deleted.", success: true, redirect: "/dashboard" };
}
