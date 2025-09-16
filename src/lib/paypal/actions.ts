
'use server';

import { createSupabaseServerClient } from "../supabase/server";
import { updateUserPlan } from "../supabase/actions";
import { v4 as uuidv4 } from 'uuid';


const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API_URL = "https://api-m.sandbox.paypal.com"; // Use sandbox for testing

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("PayPal client ID or secret is not configured in .env file.");
  }
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
    throw new Error(`Could not authenticate with PayPal. Status: ${response.status}`);
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
        if (planId === process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID) {
            plan = 'Pro';
        } else if (planId === process.env.NEXT_PUBLIC_PAYPAL_POWER_PLAN_ID) {
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


// --- One-Click Setup Action ---

async function apiRequest(accessToken: string, url: string, method: 'POST' | 'GET', body?: object) {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "PayPal-Request-Id": uuidv4(),
    };
    
    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json();
    if (!response.ok) {
        console.error(`PayPal API Error (${url}):`, data);
        const errorMessage = data.details?.[0]?.description || data.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
    }
    return data;
}

export async function createProductsAndPlans() {
    const accessToken = await getPayPalAccessToken();
    const productUrl = `${PAYPAL_API_URL}/v1/catalogs/products`;
    const plansUrl = `${PAYPAL_API_URL}/v1/billing/plans`;

    // 1. Create Product
    const productPayload = {
        name: "Botoralo",
        description: "Trading Bot Hosting Service",
        type: "SERVICE",
        category: "SOFTWARE",
    };
    const product = await apiRequest(accessToken, productUrl, 'POST', productPayload);
    const productId = product.id;
    console.log("Created PayPal Product with ID:", productId);

    // 2. Create Pro Plan
    const proPlanPayload = {
        product_id: productId,
        name: "Pro Plan",
        description: "Pro tier for Botoralo service",
        status: "ACTIVE",
        billing_cycles: [
            {
                frequency: { interval_unit: "MONTH", interval_count: 1 },
                tenure_type: "REGULAR",
                sequence: 1,
                total_cycles: 0,
                pricing_scheme: {
                    fixed_price: { value: "9.00", currency_code: "USD" },
                },
            },
        ],
        payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3,
        },
    };
    const proPlan = await apiRequest(accessToken, plansUrl, 'POST', proPlanPayload);
    const proPlanId = proPlan.id;
    console.log("Created Pro Plan with ID:", proPlanId);
    
    // 3. Create Power Plan
    const powerPlanPayload = {
        product_id: productId,
        name: "Power Plan",
        description: "Power tier for Botoralo service",
        status: "ACTIVE",
        billing_cycles: [
            {
                frequency: { interval_unit: "MONTH", interval_count: 1 },
                tenure_type: "REGULAR",
                sequence: 1,
                total_cycles: 0,
                pricing_scheme: {
                    fixed_price: { value: "29.00", currency_code: "USD" },
                },
            },
        ],
        payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3,
        },
    };
    const powerPlan = await apiRequest(accessToken, plansUrl, 'POST', powerPlanPayload);
    const powerPlanId = powerPlan.id;
    console.log("Created Power Plan with ID:", powerPlanId);

    return { proPlanId, powerPlanId };
}
