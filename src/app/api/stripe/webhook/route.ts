
import { stripe } from '@/lib/stripe/server';
import { headers } from 'next/headers';
import type { Stripe } from 'stripe';
import { upsertUserProfile } from '@/lib/supabase/actions';
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

  const supabase = createSupabaseServerClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clientReferenceId = session.client_reference_id as string;
        const customerId = session.customer as string;
        const customerEmail = session.customer_details?.email as string;

        if (!clientReferenceId || !customerId || !customerEmail) {
            throw new Error('Missing client_reference_id, customer, or email in checkout session.');
        }

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;

        let plan = 'Free';
        if (priceId === proPriceId) {
            plan = 'Pro';
        } else if (priceId === powerPriceId) {
            plan = 'Power';
        }
        
        await upsertUserProfile(clientReferenceId, customerEmail, customerId, plan);
        console.log(`Checkout session completed for ${clientReferenceId}. Plan updated to: ${plan}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('stripe_customer_id', subscription.customer as string)
            .single();

        if (!profile) {
            throw new Error(`Could not find user for customer ${subscription.customer}`);
        }

        await upsertUserProfile(profile.id, profile.email!, subscription.customer as string, 'Free');
        console.log(`Subscription cancelled for customer ${subscription.customer}. User downgraded to Free.`);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email')
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

        await upsertUserProfile(profile.id, profile.email!, subscription.customer as string, plan);
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
