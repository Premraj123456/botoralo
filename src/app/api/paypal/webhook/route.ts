
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { updateUserPlan } from '@/lib/supabase/actions';
import { verifyPayPalWebhookSignature } from '@/lib/paypal/actions';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Hardcoded Plan IDs to bypass environment variable caching issues
const proPlanId = "P-6VF91347KX5323712NDFFACQ";
const powerPlanId = "P-2FY06213L89231025NDFFACQ";


export async function POST(req: NextRequest) {
  const reqBody = await req.text();
  const reqHeaders = headers();
  
  try {
    // 1. Verify the webhook signature
    const isVerified = await verifyPayPalWebhookSignature(reqHeaders, reqBody);
    if (!isVerified) {
      console.warn('PayPal webhook signature verification failed.');
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
    }

    const event = JSON.parse(reqBody);
    const eventType = event.event_type;
    const resource = event.resource;
    
    console.log(`Received PayPal webhook event: ${eventType}`);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const userId = resource.custom_id;
        const subscriptionId = resource.id;
        const planId = resource.plan_id;
        
        if (!userId || !subscriptionId || !planId) {
            throw new Error('Missing required data in BILLING.SUBSCRIPTION.ACTIVATED event.');
        }

        let plan = 'Free';
        if (planId === proPlanId) plan = 'Pro';
        else if (planId === powerPlanId) plan = 'Power';

        await updateUserPlan({ userId, plan, subscriptionId });
        console.log(`Subscription activated for user ${userId}. Plan: ${plan}`);
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const subscriptionId = resource.id;
        if (!subscriptionId) {
            throw new Error('Missing subscription ID in cancellation/expiration event.');
        }

        const supabase = createSupabaseServerClient();
        const { data: profile }: { data: { id: string } | null } = await supabase
            .from('profiles')
            .select('id')
            .eq('paypal_subscription_id', subscriptionId)
            .single();

        if (!profile) {
            console.warn(`Could not find user for PayPal subscription ${subscriptionId}`);
            break;
        }

        await updateUserPlan({ userId: profile.id, plan: 'Free', subscriptionId: null });
        console.log(`Subscription cancelled/expired for user ${profile.id}. Downgraded to Free.`);
        break;
      }
      
      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`PayPal Webhook Error: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
}
