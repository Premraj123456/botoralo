
'use server';

import { updateUserPlan } from "../supabase/actions";
import { paddle } from "./client";

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
        const customerEmail = event.data.customer.email; // Use email as the primary link
        const userId = event.data.customData?.user_id;

        if (!customerEmail) {
            console.error(`[handlePaddleWebhook] - CRITICAL: No email found for customer ${customerId} in ${eventType}. Cannot update user.`);
            return;
        }
        
        // Pass both email and customerId to link the accounts
        const updatePayload = { 
            email: customerEmail,
            paddle_customer_id: customerId,
            userId: userId, // Pass userId if available from custom data
        };
        console.log(`[handlePaddleWebhook] - Calling updateUserPlan for ${eventType} with payload:`, updatePayload);

        await updateUserPlan(updatePayload);
        console.log(`[handlePaddleWebhook] - Successfully processed ${eventType} for email ${customerEmail}.`);
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
