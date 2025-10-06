
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

        const customerId = event.data.customer_id;
        const userId = event.data.customData?.user_id;

        if (!userId) {
            console.error(`[handlePaddleWebhook] - CRITICAL: No user_id in customData for ${eventType} on subscription ${event.data.id}. Cannot update user.`);
            return;
        }
        
        // The only thing we need to store is the customer_id to link the user to Paddle.
        const updatePayload = { 
            userId,
            paddle_customer_id: customerId 
        };
        console.log(`[handlePaddleWebhook] - Calling updateUserPlan for ${eventType} with payload:`, updatePayload);

        await updateUserPlan(updatePayload);
        console.log(`[handlePaddleWebhook] - Successfully processed ${eventType} for user ${userId}.`);
        break;
    }

    case 'subscription.canceled': {
        // We don't need to do anything here.
        // When the subscription is no longer 'active', the live API call in getUserSubscription will correctly return 'Free'.
        console.log(`[handlePaddleWebhook] - Processed subscription.canceled for user ${event.data.customData?.user_id}. No database action needed.`);
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
