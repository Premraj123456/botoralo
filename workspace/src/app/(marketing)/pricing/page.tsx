
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { getUserSubscription } from '@/lib/supabase/actions';
import { PayPalButtonsWrapper } from '@/components/paypal/paypal-buttons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Free',
    price: '$0',
    planId: null,
    description: 'For hobbyists and testing things out.',
    ram: '128MB RAM',
    features: ['1 Bot Slot', '24/7 Uptime', 'Basic Logging', 'Community Support'],
    isPrimary: false,
  },
  {
    name: 'Pro',
    price: '$9',
    planId: process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID,
    description: 'For serious traders who need more power.',
    ram: '512MB RAM',
    features: ['5 Bot Slots', '24/7 Uptime', 'Advanced Logging', 'AI Log Analysis', 'Email Support'],
    isPrimary: true,
  },
  {
    name: 'Power',
    price: '$29',
    planId: process.env.NEXT_PUBLIC_PAYPAL_POWER_PLAN_ID,
    description: 'For professionals running multiple complex bots.',
    ram: '1GB RAM',
    features: [
      '20 Bot Slots',
      '24/7 Uptime',
      'Advanced Logging',
      'AI Log Analysis',
      'Priority Support',
    ],
    isPrimary: false,
  },
];


export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<{ plan: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  const isPaypalConfigured = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID && process.env.NEXT_PUBLIC_PAYPAL_POWER_PLAN_ID;

  useEffect(() => {
    setIsClient(true);
    if (!supabase) return;
    const getSessionData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session) {
          const sub = await getUserSubscription(session.user.id);
          setSubscription(sub);
        }
    };
    getSessionData();
  }, [supabase]);

  const handleLoginRedirect = () => {
    router.push('/signin');
  }

  const renderCta = (plan: typeof plans[0]) => {
    if (!isClient) {
      return <div className="h-10 bg-gray-500 rounded animate-pulse w-full mt-4" />;
    }
    
    const isCurrentPlan = subscription?.plan === plan.name;

    if (isCurrentPlan) {
      return (
        <Button className="w-full mt-4" disabled>
          Current Plan
        </Button>
      );
    }
    
    // Free plan CTA
    if (!plan.planId) {
       return (
        <Button asChild className="w-full mt-4" variant={plan.isPrimary ? 'default' : 'outline'}>
          <Link href={user ? '/dashboard' : '/signin'}>{user ? 'Go to Dashboard' : 'Start for Free'}</Link>
        </Button>
      );
    }
    
    // Paid plan CTA
    if (!isPaypalConfigured) return null; // Don't render if not configured

    return (
        <PayPalButtonsWrapper 
            planId={plan.planId} 
            userId={user?.id} 
            onLoginRequired={handleLoginRedirect}
        />
    );
  }

  return (
    <div className="py-12 md:py-20 lg:py-24 z-10 relative">
      <div className="container mx-auto px-4 md:px-6 flex flex-col gap-12 items-center">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Choose the perfect plan for your bots
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Simple, transparent pricing. No hidden fees. Cancel anytime.
          </p>
        </div>

        {!isPaypalConfigured && (
            <Alert variant="destructive" className="max-w-2xl">
                <Terminal className="h-4 w-4" />
                <AlertTitle>PayPal Not Configured</AlertTitle>
                <AlertDescription>
                   The PayPal environment variables are not set. Please create subscription plans in your PayPal developer dashboard and add the Plan IDs to your `.env` file to enable checkout.
                </AlertDescription>
            </Alert>
        )}

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl w-full">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(`bg-card/50 border-border/50 backdrop-blur-sm flex flex-col`,
                plan.isPrimary && 'border-primary ring-2 ring-primary shadow-2xl shadow-primary/20',
                subscription?.plan === plan.name && 'border-primary ring-2 ring-primary'
              )}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">{plan.name}</CardTitle>
                <p className="text-4xl font-bold">
                  {plan.price}
                  <span className="text-lg font-normal text-muted-foreground">/mo</span>
                </p>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 flex-grow">
                <div className="text-center font-semibold bg-muted py-2 rounded-md">
                  {plan.ram}
                </div>
                <ul className="space-y-3 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                {renderCta(plan)}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
