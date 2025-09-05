
'use server';

import { stripe } from './server';
import { headers } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

// Mock database for user subscriptions
const userSubscriptions: { [userId: string]: { plan: string; botLimit: number } } = {};

export async function getUserSubscription(userId: string) {
  // In a real app, you would fetch this from your database.
  // Here, we'll use a mock object and default to the free plan.
  const subscription = userSubscriptions[userId] || { plan: 'Free', botLimit: 1 };
  return subscription;
}


export async function createStripeCheckout(email: string, priceId: string) {
  try {
    const origin = headers().get('origin') || 'http://localhost:9002';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      mode: 'subscription',
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
    });

    return { sessionId: session.id };
  } catch (e) {
    console.error(e);
    return { checkoutError: (e as Error).message };
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
    let envFileContent = await fs.readFile(envPath, 'utf-8');

    // Update Pro plan price ID
    envFileContent = envFileContent.replace(
      /^NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID=.*/m,
      `NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID=${proPrice.id}`
    );

    // Update Power plan price ID
    envFileContent = envFileContent.replace(
      /^NEXT_PUBLIC_STRIPE_POWER_PLAN_PRICE_ID=.*/m,
      `NEXT_PUBLIC_STRIPE_POWER_PLAN_PRICE_ID=${powerPrice.id}`
    );

    await fs.writeFile(envPath, envFileContent);
    
    console.log('Successfully created products and updated .env file.');
    console.log(`Pro Plan Price ID: ${proPrice.id}`);
    console.log(`Power Plan Price ID: ${powerPrice.id}`);

    return {
      proPlan: { productId: proProduct.id, priceId: proPrice.id },
      powerPlan: { productId: powerProduct.id, priceId: powerPrice.id },
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Failed to seed Stripe products:', errorMessage);
    return { error: `Stripe Error: ${errorMessage}` };
  }
}
