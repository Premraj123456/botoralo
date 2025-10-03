
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Paddle, EventName } from '@paddle/paddle-sdk';
import { handlePaddleWebhook } from '@/lib/paddle/actions';

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

export async function POST(req: NextRequest) {
  const reqBody = await req.text();
  const signature = headers().get('paddle-signature');
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET!;
  
  if (!signature || !webhookSecret) {
      console.error("Paddle webhook signature or secret is missing.");
      return new NextResponse('Configuration error.', { status: 500 });
  }

  try {
    const event = paddle.webhooks.unmarshal(reqBody, webhookSecret, signature);
    
    if (event) {
        await handlePaddleWebhook(event);
        return new NextResponse('OK', { status: 200 });
    } else {
        return new NextResponse('Unknown event', { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown webhook error';
    console.error(`Paddle Webhook Error: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
}

    