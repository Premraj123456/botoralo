
'use server';

import { Paddle, Environment } from '@paddle/sdk-node';
import { updateUserPlan } from "../supabase/actions";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: Environment.sandbox,
});

const proPlanId = process.env.NEXT_PUBLIC_PADDLE_PRO_PLAN_ID!;
const powerPlanId = process.env.NEXT_PUBLIC_PADDLE_POWER_PLAN_ID!;


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
        
        let plan = 'Free';
        if (priceId === proPlanId) plan = 'Pro';
        else if (priceId === powerPlanId) plan = 'Power';

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

    