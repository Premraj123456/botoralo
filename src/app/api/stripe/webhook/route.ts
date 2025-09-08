
import { stripe } from '@/lib/stripe/server';
import { headers } from 'next/headers';
import type { Stripe } from 'stripe';
import { updateUserSubscription } from '@/lib/stripe/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID!;
const powerPriceId = process.env.NEXT_PUBLIC_STRIPE_POWER_PLAN_PRICE_ID!;

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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clientReferenceId = session.client_reference_id as string;
        const customerId = session.customer as string;

        if (!clientReferenceId || !customerId) {
            throw new Error('Missing client_reference_id or customer in checkout session.');
        }

        // Retrieve the line items to determine the plan
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;

        let plan = 'Free';
        if (priceId === proPriceId) {
            plan = 'Pro';
        } else if (priceId === powerPriceId) {
            plan = 'Power';
        }
        
        await updateUserSubscription(clientReferenceId, plan, customerId);
        console.log(`Checkout session completed for ${clientReferenceId}. Plan: ${plan}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const supabase = createSupabaseServerClient();
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', subscription.customer as string)
            .single();

        if (!profile) {
            throw new Error(`Could not find user for customer ${subscription.customer}`);
        }

        await updateUserSubscription(profile.id, 'Free', null);
        console.log(`Subscription cancelled for customer ${subscription.customer}. User downgraded to Free.`);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const supabase = createSupabaseServerClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer as string)
          .single();

        if (!profile) {
          throw new Error(`Could not find user for customer ${subscription.customer}`);
        }

        const priceId = subscription.items.data[0].price.id;
        let plan = 'Free';
        if (priceId === proPriceId) {
          plan = 'Pro';
        } else if (priceId === powerPriceId) {
          plan = 'Power';
        }

        await updateUserSubscription(profile.id, plan, subscription.customer as string);
        console.log(`Subscription updated for customer ${subscription.customer}. New plan: ${plan}`);
        break;
      }
      default:
        console.warn(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     console.error(`Webhook handler error: ${errorMessage}`);
     return new Response(`Webhook handler error: ${errorMessage}`, { status: 500 });
  }


  return new Response(null, { status: 200 });
}
