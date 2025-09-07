
'use server';

import { stripe } from './server';
import { headers } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// This is a mock database for user subscriptions.
// In a real application, you would use a proper database.
// The key is the 'client_reference_id' passed during checkout.
const userSubscriptions: { [userId: string]: { plan: string; customerId: string | null } } = {
  'user_placeholder': { plan: 'Free', customerId: null }
};

// This function will now be updated to get the real user ID
async function getUserIdForSubscription() {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    // Fallback to mock user if no user is logged in
    return user ? user.id : 'user_placeholder';
}

export async function getUserSubscription() {
  const userId = await getUserIdForSubscription();
  // In a real app, you would fetch this from your database based on the logged-in user.
  return userSubscriptions[userId] || { plan: 'Free', customerId: null };
}

export async function updateUserSubscription(userId: string, plan: string, customerId: string) {
    console.log(`Updating subscription for ${userId} to ${plan} with customer ID ${customerId}`);
    userSubscriptions[userId] = { plan, customerId };
}


export async function createStripeCheckout(priceId: string) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        throw new Error('User must be logged in to make a purchase.');
    }
    
    if (!priceId) {
        throw new Error('Price ID is missing.');
    }

    const origin = headers().get('origin') || 'https://botpilot.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: user.id, 
      customer_email: user.email,
      mode: 'subscription',
      success_url: `${origin}/dashboard?subscription_success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
    });

    if (!session.url) {
      throw new Error('Failed to create a checkout session.');
    }

    return { url: session.url, checkoutError: null };
  } catch (e) {
    console.error("Stripe Checkout Error:", e);
    return { url: null, checkoutError: (e as Error).message };
  }
}

export async function createStripeBillingPortalSession() {
    try {
        const subscription = await getUserSubscription();
        if (!subscription.customerId) {
            throw new Error("User does not have a subscription to manage.");
        }

        const origin = headers().get('origin') || 'http://localhost:9002';

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.customerId,
            return_url: `${origin}/dashboard/billing`,
        });

        if (!portalSession.url) {
            throw new Error('Failed to create a billing portal session.');
        }

        return { url: portalSession.url, portalError: null };
    } catch (e) {
        console.error(e);
        return { url: null, portalError: (e as Error).message };
    }
}


// Action to create products and update .env file
export async function seedStripeProducts() {
  try {
    // 1. Create the "Pro" Product and Price
    const proProduct = await stripe.products.create({
      name: 'Pro Plan',
      description: 'For serious traders who need more power.',
    });
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 900, // $9.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    // 2. Create the "Power" Product and Price
    const powerProduct = await stripe.products.create({
      name: 'Power Plan',
      description: 'For professionals running multiple complex bots.',
    });
    const powerPrice = await stripe.prices.create({
      product: powerProduct.id,
      unit_amount: 2900, // $29.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });

    // 3. Update the .env file
    const envPath = path.resolve(process.cwd(), '.env');
    let envFileContent = '';
    try {
        envFileContent = await fs.readFile(envPath, 'utf-8');
    } catch (e) {
        // File might not exist, that's okay.
    }

    const updates = {
      NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID: proPrice.id,
      NEXT_PUBLIC_STRIPE_POWER_PLAN_PRICE_ID: powerPrice.id,
    };

    for (const [key, value] of Object.entries(updates)) {
        if (envFileContent.includes(key)) {
            envFileContent = envFileContent.replace(
                new RegExp(`^${key}=.*`, 'm'),
                `${key}=${value}`
            );
        } else {
            envFileContent += `\n${key}=${value}`;
        }
    }
    
    await fs.writeFile(envPath, envFileContent.trim());
    
    console.log('Successfully created products and updated .env file.');
    console.log(`Pro Plan Price ID: ${proPrice.id}`);
    console.log(`Power Plan Price ID: ${powerPrice.id}`);

    return {
      proPlan: { productId: proProduct.id, priceId: proPrice.id },
      powerPlan: { productId: powerProduct.id, priceId: powerPrice.id },
      error: null,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Failed to seed Stripe products:', errorMessage);
    return { error: `Stripe Error: ${errorMessage}` };
  }
}
