'use server';

import { stripe } from './server';
import { headers } from 'next/headers';

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
