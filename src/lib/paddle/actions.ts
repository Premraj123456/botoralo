
'use server';

import { updateUserPlan } from "../supabase/actions";
import { paddle } from "./client";

export async function handlePaddleWebhook(event: any) {
  console.log(`[handlePaddleWebhook] - Received Paddle webhook event: ${event.event_type}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[handlePaddleWebhook] - Full event data:', JSON.stringify(event.data, null, 2));
  }

  // Only handle subscription creation/activation to store the customer ID
  if (event.event_type === 'subscription.activated' || event.event_type === 'subscription.created') {
    const customerId = event.data.customer_id;
    // We need to get the email associated with this customer
    const customer = await paddle.customers.get(customerId);
    
    if (!customer || !customer.email) {
      console.error(`[handlePaddleWebhook] - CRITICAL: No email found for customer ${customerId}. Cannot link subscription.`);
      return;
    }

    console.log(`[handlePaddleWebhook] - Storing customer ID for email: ${customer.email}`);
    await updateUserPlan({
      email: customer.email,
      paddle_customer_id: customerId,
    });
  } else {
    console.log(`[handlePaddleWebhook] - Ignoring event type: ${event.event_type} as it does not require DB action.`);
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
