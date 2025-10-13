
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PaddleCheckout } from '@/components/paddle/paddle-checkout';

const plans = [
  {
    name: 'Free',
    price: '$0',
    productId: null,
    description: 'For hobbyists and testing things out.',
    ram: '128MB RAM',
    features: ['1 Bot Slot', '24/7 Uptime', 'Basic Logging', 'Community Support'],
    isPrimary: false,
  },
  {
    name: 'PRO',
    price: '$9',
    productId: process.env.NEXT_PUBLIC_PADDLE_PRO_PLAN_ID,
    description: 'For serious bot developers who need more power.',
    ram: '512MB RAM',
    features: ['5 Bot Slots', '24/7 Uptime', 'Advanced Logging', 'AI Log Analysis', 'Email Support'],
    isPrimary: true,
  },
  {
    name: 'POWER',
    price: '$29',
    productId: process.env.NEXT_PUBLIC_PADDLE_POWER_PLAN_ID,
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

type Subscription = {
  plan: string;
  paddle_customer_id: string | null;
} | null;

type PricingClientProps = {
    user: User | null;
    subscription: Subscription;
}

export function PricingClient({ user, subscription }: PricingClientProps) {
  const router = useRouter();
  const isPaddleConfigured = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

  const handleLoginRedirect = () => {
    router.push('/signin');
  }
  
  const onCheckoutSuccess = () => {
    // Webhooks will handle the plan update. We just need to navigate.
    router.push(`/dashboard/subscription-success`);
  }

  const renderCta = (plan: typeof plans[0]) => {
    const isCurrentPlan = subscription?.plan === plan.name;

    if (isCurrentPlan) {
      return (
        <Button className="w-full mt-4" disabled>
          Current Plan
        </Button>
      );
    }
    
    if (!plan.productId) {
       return (
        <Button asChild className="w-full mt-4" variant={plan.isPrimary ? 'default' : 'outline'}>
          <Link href={user ? '/dashboard' : '/signin'}>{user ? 'Go to Dashboard' : 'Start for Free'}</Link>
        </Button>
      );
    }
    
    if (!isPaddleConfigured || !plan.productId) {
        return (
            <Button className="w-full mt-4" variant={plan.isPrimary ? 'default' : 'outline'} disabled>
                Configure Environment
            </Button>
        );
    }

    if (user) {
        return (
            <PaddleCheckout
                productId={plan.productId!}
                email={user.email}
                passthrough={{ user_id: user.id }}
                onSuccess={onCheckoutSuccess}
            />
        );
    }

    return (
        <Button onClick={handleLoginRedirect} className="w-full mt-4" variant={plan.isPrimary ? 'default' : 'outline'}>
            Sign in to Upgrade
        </Button>
    )
  }

  return (
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
  );
}
