
import { NextRequest, NextResponse } from 'next/server';
import { handlePaddleWebhook } from '@/lib/paddle/actions';

/**
 * THIS IS A TEST-ONLY ENDPOINT.
 * It bypasses Paddle signature verification to allow for direct testing of the webhook logic
 * in environments where external webhooks may be blocked (like a firewalled development server).
 * DO NOT USE THIS IN PRODUCTION.
 */
export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    console.log('[/api/paddle/test-webhook] - Received a request with event:', event.event_type);
    
    // Call the actual webhook handler logic
    await handlePaddleWebhook(event);
    
    console.log('[/api/paddle/test-webhook] - Successfully processed test event.');
    return new NextResponse(JSON.stringify({ message: 'Test event processed successfully' }), { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
    console.error(`[/api/paddle/test-webhook] - Error processing test webhook: ${errorMessage}`);
    return new NextResponse(`Test Webhook Error: ${errorMessage}`, { status: 400 });
  }
}
