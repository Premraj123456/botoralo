
'use server';

import { createSupabaseServerClient } from "../supabase/server";
import { updateUserPlan } from "../supabase/actions";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API_URL = "https://api-m.sandbox.paypal.com"; // Use sandbox for testing

const proPlanId = process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID!;
const powerPlanId = process.env.NEXT_PUBLIC_PAYPAL_POWER_PLAN_ID!;


async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${auth}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Failed to get PayPal access token", data);
    throw new Error("Could not authenticate with PayPal.");
  }
  return data.access_token;
}

export async function createPayPalSubscription(planId: string, userId: string) {
    if (!userId) {
        throw new Error("User ID is required to create a subscription.");
    }
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            plan_id: planId,
            custom_id: userId, // Pass the Supabase user ID here
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        console.error("Failed to create PayPal subscription", data);
        throw new Error("Could not create PayPal subscription.");
    }

    return data;
}

export async function capturePayPalSubscription(subscriptionId: string, planId: string, userId: string) {
    try {
        let plan = 'Free';
        if (planId === proPlanId) {
            plan = 'Pro';
        } else if (planId === powerPlanId) {
            plan = 'Power';
        }
        
        await updateUserPlan({ userId, plan, subscriptionId });

        return { success: true };
    } catch (error) {
        console.error("Error capturing PayPal subscription and updating user plan:", error);
        return { success: false, error: (error as Error).message };
    }
}


export async function verifyPayPalWebhookSignature(headers: Headers, body: string) {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            transmission_id: headers.get('paypal-transmission-id'),
            transmission_time: headers.get('paypal-transmission-time'),
            cert_url: headers.get('paypal-cert-url'),
            auth_algo: headers.get('paypal-auth-algo'),
            transmission_sig: headers.get('paypal-transmission-sig'),
            webhook_id: process.env.PAYPAL_WEBHOOK_ID,
            webhook_event: JSON.parse(body),
        }),
    });

    const data = await response.json();
    return data.verification_status === 'SUCCESS';
}
