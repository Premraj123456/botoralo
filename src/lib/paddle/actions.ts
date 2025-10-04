
'use server';

import { Paddle } from 'paddle';
import { updateUserPlan } from "../supabase/actions";

// Initialize Paddle with the correct environment setting
export const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: process.env.PADDLE_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production',
});

export async function handlePaddleWebhook(event: any) {
  console.log(`[handlePaddleWebhook] - Received Paddle webhook event: ${event.event_type}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[handlePaddleWebhook] - Full event data:', JSON.stringify(event.data, null, 2));
  }


  switch (event.event_type) {
    case 'subscription.activated':
    case 'subscription.updated': {
        const eventType = event.event_type;
        console.log(`[handlePaddleWebhook] - Processing ${eventType}.`);

        const subscriptionId = event.data.id;
        const customerId = event.data.customer_id;
        const userId = event.data.customData?.user_id;

        if (!userId) {
            console.error(`[handlePaddleWebhook] - CRITICAL: No user_id in customData for ${eventType} on subscription ${subscriptionId}. Cannot update user plan.`);
            return;
        }
        
        const planItem = event.data.items.find((item: any) => item.price.type === 'recurring');
        if (!planItem) {
             console.error(`[handlePaddleWebhook] - CRITICAL: No recurring plan item found in ${eventType} on subscription ${subscriptionId}. Cannot determine plan.`);
             return;
        }
        
        const priceId = planItem.price.id;
        let plan = 'Free'; // Default
        if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRO_PLAN_ID) {
            plan = 'Pro';
        } else if (priceId === process.env.NEXT_PUBLIC_PADDLE_POWER_PLAN_ID) {
            plan = 'Power';
        } else {
            console.warn(`[handlePaddleWebhook] - Warning: Unrecognized price ID "${priceId}" for subscription ${subscriptionId}. Defaulting to Free plan.`);
        }
        
        const updatePayload = { 
            userId,
            plan, 
            paddle_subscription_id: subscriptionId, 
            paddle_customer_id: customerId 
        };
        console.log(`[handlePaddleWebhook] - Calling updateUserPlan for ${eventType} with payload:`, updatePayload);

        await updateUserPlan(updatePayload);
        console.log(`[handlePaddleWebhook] - Successfully processed ${eventType} for user ${userId}. Plan set to: ${plan}`);
        break;
    }

    case 'subscription.canceled': {
        console.log(`[handlePaddleWebhook] - Processing subscription.canceled.`);
        const subscriptionId = event.data.id;
        const userId = event.data.customData?.user_id;
        const customerId = event.data.customer_id;

        if (!userId) {
            console.error(`[handlePaddleWebhook] - CRITICAL: No user_id in customData for subscription.canceled on subscription ${subscriptionId}. Cannot downgrade plan.`);
            return;
        }

        const updatePayload = { 
            userId, 
            plan: 'Free', 
            paddle_subscription_id: null, // Clear the subscription ID
            paddle_customer_id: customerId 
        };
        console.log('[handlePaddleWebhook] - Calling updateUserPlan for cancellation with payload:', updatePayload);

        await updateUserPlan(updatePayload);
        console.log(`[handlePaddleWebhook] - Successfully processed subscription cancellation for user ${userId}.`);
        break;
    }
    
    default:
        console.log(`[handlePaddleWebhook] - Unhandled Paddle event type: ${event.event_type}`);
  }
}

export async function manageSubscription(customerId: string) {
    if (!customerId) {
        throw new Error("No customer ID provided.");
    }
    try {
        console.log(`[manageSubscription] - Generating customer portal link for customerId: ${customerId}`);
        const customerPortal = await paddle.customerPortal.create({ customerId: customerId });
        return { url: customerPortal.url };
    } catch (error) {
        console.error("[manageSubscription] - Error generating Paddle management link", error);
        throw new Error("Could not generate subscription management link.");
    }
}
