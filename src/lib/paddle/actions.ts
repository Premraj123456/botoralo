
'use server';

import { Paddle, Environment, EventName } from '@paddle/paddle-sdk';
import { updateUserPlan } from "../supabase/actions";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: Environment.sandbox,
});

export async function handlePaddleWebhook(event: any) {
  console.log(`Received Paddle webhook event: ${event.event_type}`);

  switch (event.event_type) {
    case 'subscription.activated':
    case 'subscription.updated': {
        const subscriptionId = event.data.id;
        const customerId = event.data.customer_id;
        const userId = event.data.custom_data?.user_id;

        if (!userId) {
            console.warn(`Webhook Error: No user_id in custom_data for subscription ${subscriptionId}`);
            return;
        }

        const planItem = event.data.items.find((item: any) => item.price.type === 'recurring');
        const priceId = planItem?.price.id;
        
        // Match price IDs from the front-end configuration
        // This is where you would map your actual price IDs to plan names
        let plan = 'Free';
        if (priceId) {
            // A more robust solution would be to fetch all your price IDs and map them
            // For now, we assume we can infer from the event or need a mapping here.
            // This example doesn't have the price IDs, so we can't reliably set 'Pro' or 'Power'
            // A better approach is to store the plan name in custom_data during checkout.
            // Let's assume for now any paid plan is "Pro" for simplicity.
            plan = 'Pro'; // This is a simplification.
        }

        await updateUserPlan({ userId, plan, paddle_subscription_id: subscriptionId, paddle_customer_id: customerId });
        console.log(`Subscription updated for user ${userId}. Plan: ${plan}`);
        break;
    }

    case 'subscription.canceled': {
        const subscriptionId = event.data.id;
        const userId = event.data.custom_data?.user_id;

        if (!userId) {
            console.warn(`Webhook Error: No user_id in custom_data for subscription ${subscriptionId}`);
            return;
        }
        
        await updateUserPlan({ userId, plan: 'Free', paddle_subscription_id: null, paddle_customer_id: null });
        console.log(`Subscription cancelled for user ${userId}. Downgraded to Free.`);
        break;
    }
    
    default:
        console.log(`Unhandled Paddle event type: ${event.event_type}`);
  }
}

export async function manageSubscription(subscriptionId: string) {
    if (!subscriptionId) {
        throw new Error("No subscription ID provided.");
    }
    try {
        const updateLink = await paddle.subscriptions.getUpdatePaymentMethodTransaction(subscriptionId);
        return { url: updateLink.url };
    } catch (error) {
        console.error("Error generating Paddle management link", error);
        throw new Error("Could not generate subscription management link.");
    }
}
