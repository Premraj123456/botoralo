
'use server';

import { Paddle, Environment, EventName } from 'paddle';
import { updateUserPlan } from "../supabase/actions";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: process.env.PADDLE_ENVIRONMENT === 'sandbox' ? Environment.Sandbox : Environment.Production,
});

export async function handlePaddleWebhook(event: any) {
  console.log(`[handlePaddleWebhook] - Received Paddle webhook event: ${event.event_type}`);
  console.log('[handlePaddleWebhook] - Event data:', JSON.stringify(event.data, null, 2));


  switch (event.event_type) {
    case 'subscription.activated':
    case 'subscription.updated': {
        const subscriptionId = event.data.id;
        const customerId = event.data.customer_id;
        const userId = event.data.custom_data?.user_id;

        if (!userId) {
            console.warn(`[handlePaddleWebhook] - Webhook Error: No user_id in custom_data for subscription ${subscriptionId}`);
            return;
        }

        const customer = await paddle.customers.get(customerId);
        if (!customer.email) {
            console.warn(`[handlePaddleWebhook] - Webhook Error: No email found for customer ${customerId}`);
            return;
        }

        const planItem = event.data.items.find((item: any) => item.price.type === 'recurring');
        const priceId = planItem?.price.id;
        
        let plan = 'Free';
        if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRO_PLAN_ID) {
            plan = 'Pro';
        } else if (priceId === process.env.NEXT_PUBLIC_PADDLE_POWER_PLAN_ID) {
            plan = 'Power';
        }
        
        const updatePayload = { userId, email: customer.email, plan, paddle_subscription_id: subscriptionId, paddle_customer_id: customerId };
        console.log('[handlePaddleWebhook] - Calling updateUserPlan with payload:', updatePayload);

        await updateUserPlan(updatePayload);
        console.log(`[handlePaddleWebhook] - Subscription created/updated for user ${userId}. Plan: ${plan}`);
        break;
    }

    case 'subscription.canceled': {
        const subscriptionId = event.data.id;
        const userId = event.data.custom_data?.user_id;
        const customerId = event.data.customer_id;

        if (!userId) {
            console.warn(`[handlePaddleWebhook] - Webhook Error: No user_id in custom_data for subscription ${subscriptionId}`);
            return;
        }
        
        const customer = await paddle.customers.get(customerId);
         if (!customer.email) {
            console.warn(`[handlePaddleWebhook] - Webhook Error: No email found for customer ${customerId}`);
            return;
        }

        const updatePayload = { userId, email: customer.email, plan: 'Free', paddle_subscription_id: null, paddle_customer_id: customerId };
        console.log('[handlePaddleWebhook] - Calling updateUserPlan for cancellation with payload:', updatePayload);

        await updateUserPlan(updatePayload);
        console.log(`[handlePaddleWebhook] - Subscription cancelled for user ${userId}. Downgraded to Free.`);
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
        console.log(`[manageSubscription] - Fetching customer portal for customerId: ${customerId}`);
        const customer = await paddle.customers.get(customerId);
        if (!customer || !customer.managementUrl) {
             throw new Error("Could not retrieve customer portal URL.");
        }
        console.log(`[manageSubscription] - Successfully fetched portal URL.`);
        return { url: customer.managementUrl };
    } catch (error) {
        console.error("[manageSubscription] - Error generating Paddle management link", error);
        throw new Error("Could not generate subscription management link.");
    }
}
