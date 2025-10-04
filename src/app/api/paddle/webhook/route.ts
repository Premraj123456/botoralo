
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Paddle, EventName } from 'paddle';
import { handlePaddleWebhook } from '@/lib/paddle/actions';

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

export async function POST(req: NextRequest) {
  const reqBody = await req.text();
  const signature = headers().get('paddle-signature');
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET!;
  
  console.log('[/api/paddle/webhook] - Received a request from Paddle.');

  if (!signature || !webhookSecret) {
      console.error("[/api/paddle/webhook] - Error: Paddle webhook signature or secret is missing.");
      return new NextResponse('Configuration error.', { status: 500 });
  }

  try {
    console.log('[/api/paddle/webhook] - Attempting to unmarshal webhook...');
    const event = paddle.webhooks.unmarshal(reqBody, webhookSecret, signature);
    console.log(`[/api/paddle/webhook] - Successfully unmarshalled event: ${event?.event_type}`);
    
    if (event) {
        await handlePaddleWebhook(event);
        return new NextResponse('OK', { status: 200 });
    } else {
        console.warn('[/api/paddle/webhook] - Warning: Could not unmarshal event, or event is unknown.');
        return new NextResponse('Unknown event', { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
    console.error(`[/api/paddle/webhook] - Paddle Webhook Error: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
}
