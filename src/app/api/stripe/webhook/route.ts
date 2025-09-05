import { stripe } from '@/lib/stripe/server';
import { headers } from 'next/headers';
import type { Stripe } from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log(`❌ Error message: ${errorMessage}`);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  console.log('✅ Success:', event.id);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: Fulfill the purchase.
      // e.g., grant access to the product, update user's subscription in your database.
      console.log(`Checkout session completed for customer ${session.customer}`);
      break;
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      // TODO: Handle successful recurring payment.
      console.log(`Invoice payment succeeded for customer ${invoice.customer}`);
      break;
    // ... handle other event types
    default:
      console.warn(`Unhandled event type ${event.type}`);
  }

  return new Response(null, { status: 200 });
}
