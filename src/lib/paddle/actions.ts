
'use server';

import { Paddle } from '@paddle/paddle-node-sdk';

export async function handlePaddleWebhook(event: any) {
  console.log(`[handlePaddleWebhook] - Received Paddle webhook event: ${event.event_type}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[handlePaddleWebhook] - Full event data:', JSON.stringify(event.data, null, 2));
  }

  // Business logic for webhooks can be added here.
  // For now, the app relies on direct fetching, so this can be minimal.
  console.log(`[handlePaddleWebhook] - Ignoring event type: ${event.event_type} as no DB action is required.`);
}

export async function manageSubscription({ customerId }: { customerId: string }) {
    if (!customerId) {
        throw new Error("No customer ID provided.");
    }
    try {
        console.log(`[manageSubscription] - Generating customer portal link for customerId: ${customerId}`);
        
        // Initialize Paddle client directly within the server action to ensure it's available.
        const paddleClient = new Paddle(process.env.PADDLE_API_KEY!, {
            environment: process.env.NODE_ENV === 'development' ? 'sandbox' : 'production',
        });

        // The customerId should be passed directly as a string argument.
        const customerPortal = await paddleClient.customerPortalSessions.create(customerId);

        console.log('[manageSubscription] - Full response from Paddle:', JSON.stringify(customerPortal, null, 2));
        
        // Correctly extract the URL from the nested response object
        const portalUrl = customerPortal.urls.general.overview;
        if (!portalUrl) {
            throw new Error("Could not find the portal URL in the Paddle response.");
        }

        return { url: portalUrl };
    } catch (error) {
        console.error("[manageSubscription] - Error generating Paddle management link", error);
        throw new Error("Could not generate subscription management link.");
    }
}
