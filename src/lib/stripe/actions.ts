
'use server';

import { stripe } from './server';
import { headers } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { upsertUserProfile } from '../supabase/actions';

export async function getUserSubscription(userId: string) {
  try {
    const supabase = createSupabaseServerClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, stripe_customer_id')
      .eq('id', userId)
      .single();
      
    if (!profile) {
      console.log(`No profile found for user ${userId}. This is expected for new users. Defaulting to Free plan.`);
      return { plan: 'Free', customerId: null };
    }
    
    return { plan: profile.plan || 'Free', customerId: profile.stripe_customer_id };
  } catch (error) {
    console.error("Error getting user subscription:", (error as Error).message);
    // Return a default value in case of an error to prevent crashes
    return { plan: 'Free', customerId: null };
  }
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
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: user.email,
            metadata: { supabase_id: user.id }
        });
        customerId = customer.id;
        // Save the new customer ID to the user's profile
        await upsertUserProfile({ userId: user.id, email: user.email, customerId });
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: user.id, 
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard?subscription_success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
    });
    
    console.log("Stripe checkout session created:", session.id);

    if (!session.url) {
      throw new Error('Failed to create a checkout session.');
    }

    return { url: session.url, checkoutError: null };
  } catch (e) {
    console.error("Stripe Checkout Error:", e);
    return { url: null, checkoutError: (e as Error).message };
  }
}

export async function createStripeBillingPortalSession(userId: string) {
    try {
        const subscription = await getUserSubscription(userId);
        if (!subscription.customerId) {
            throw new Error("User does not have a subscription to manage.");
        }
        
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.customerId,
            return_url: `${baseUrl}/dashboard/billing`,
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
