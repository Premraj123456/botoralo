
'use server';

import { Paddle, Environment, EventName } from '@paddle/sdk-node';
import { updateUserPlan } from "../supabase/actions";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: process.env.PADDLE_ENVIRONMENT === 'sandbox' ? Environment.sandbox : Environment.production,
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

        const customer = await paddle.customers.get(customerId);
        if (!customer.email) {
            console.warn(`Webhook Error: No email found for customer ${customerId}`);
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

        await updateUserPlan({ userId, email: customer.email, plan, paddle_subscription_id: subscriptionId, paddle_customer_id: customerId });
        console.log(`Subscription created/updated for user ${userId}. Plan: ${plan}`);
        break;
    }

    case 'subscription.canceled': {
        const subscriptionId = event.data.id;
        const userId = event.data.custom_data?.user_id;
        const customerId = event.data.customer_id;

        if (!userId) {
            console.warn(`Webhook Error: No user_id in custom_data for subscription ${subscriptionId}`);
            return;
        }
        
        const customer = await paddle.customers.get(customerId);
         if (!customer.email) {
            console.warn(`Webhook Error: No email found for customer ${customerId}`);
            return;
        }

        await updateUserPlan({ userId, email: customer.email, plan: 'Free', paddle_subscription_id: null, paddle_customer_id: customerId });
        console.log(`Subscription cancelled for user ${userId}. Downgraded to Free.`);
        break;
    }
    
    default:
        console.log(`Unhandled Paddle event type: ${event.event_type}`);
  }
}

export async function manageSubscription(customerId: string) {
    if (!customerId) {
        throw new Error("No customer ID provided.");
    }
    try {
        const customer = await paddle.customers.get(customerId);
        if (!customer) {
            throw new Error("Customer not found.");
        }

        const portal = await paddle.customerPortal.create(customer.id);
        
        return { url: portal.url };
    } catch (error) {
        console.error("Error generating Paddle management link", error);
        throw new Error("Could not generate subscription management link.");
    }
}

