
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, Bot, Loader2 } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';
import { createStripeCheckout } from '@/lib/stripe/actions';
import { toast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';


const plans = [
  {
    name: 'Free',
    price: '$0',
    priceId: null,
    description: 'For hobbyists and testing things out.',
    ram: '128MB RAM',
    features: ['1 Bot Slot', '24/7 Uptime', 'Basic Logging', 'Community Support'],
    cta: 'Start for Free',
    isPrimary: false,
  },
  {
    name: 'Pro',
    price: '$9',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID!,
    description: 'For serious traders who need more power.',
    ram: '512MB RAM',
    features: ['5 Bot Slots', '24/7 Uptime', 'Advanced Logging', 'AI Log Analysis', 'Email Support'],
    cta: 'Upgrade to Pro',
    isPrimary: true,
  },
  {
    name: 'Power',
    price: '$29',
    priceId: process.env.NEXT_PUBLIC_STRIPE_POWER_PLAN_PRICE_ID!,
    description: 'For professionals running multiple complex bots.',
    ram: '1GB RAM',
    features: [
      '20 Bot Slots',
      '24/7 Uptime',
      'Advanced Logging',
      'AI Log Analysis',
      'Priority Support',
    ],
    cta: 'Go Power',
    isPrimary: false,
  },
];

export default function PricingPage() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };
    getUser();
  }, [supabase]);


  const handleCheckout = async (priceId: string) => {
    if (!user) {
        router.push('/signin');
        return;
    }

    setLoadingPriceId(priceId);
    try {
      const result = await createStripeCheckout(priceId);

      if (result?.checkoutError || !result?.url) {
        throw new Error(result?.checkoutError || 'Could not create checkout session.');
      }
      
      // Redirect to the Stripe checkout page.
      window.location.href = result.url;

    } catch (error) {
      console.error('Checkout Error:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none"></div>
      </div>
      <header className="px-4 lg:px-6 h-16 flex items-center bg-transparent backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <Link className="flex items-center justify-center" href="/">
          <Bot className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-semibold tracking-wider font-headline">BotPilot</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
        </nav>
      </header>
      <main className="py-12 md:py-20 lg:py-24 z-10 relative">
        <div className="container mx-auto px-4 md:px-6 flex flex-col gap-12 items-center">
          <div className="text-center max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Choose the perfect plan for your bots
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Simple, transparent pricing. No hidden fees. Cancel anytime.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl w-full">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`bg-card/50 border-border/50 backdrop-blur-sm flex flex-col ${
                  plan.isPrimary ? 'border-primary ring-2 ring-primary shadow-2xl shadow-primary/20' : ''
                }`}
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
                  {plan.priceId ? (
                    <Button
                      className="w-full mt-4"
                      variant={plan.isPrimary ? 'default' : 'outline'}
                      onClick={() => handleCheckout(plan.priceId!)}
                      disabled={loadingPriceId === plan.priceId}
                    >
                      {loadingPriceId === plan.priceId && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {plan.cta}
                    </Button>
                  ) : (
                     <Button asChild className="w-full mt-4" variant="outline">
                      <Link href={user ? "/dashboard" : "/signin"}>{plan.cta}</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
