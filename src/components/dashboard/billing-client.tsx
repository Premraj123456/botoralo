'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ClientLink } from '@/components/layout/client-link';
import type { User } from "@supabase/supabase-js";
import { manageSubscription } from "@/lib/paddle/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Subscription = {
  plan: string;
  paddle_customer_id: string | null;
} | null;

type BillingClientProps = {
    user: User | null;
    subscription: Subscription;
}

export function BillingClient({ user, subscription }: BillingClientProps) {
  const [isManaging, setIsManaging] = useState(false);
  const { toast } = useToast();

  const handleManageSubscription = async () => {
    if (!subscription?.paddle_customer_id) {
        toast({ title: "Error", description: "No customer ID found to manage billing.", variant: "destructive" });
        return;
    }
    setIsManaging(true);
    try {
        const { url } = await manageSubscription({ customerId: subscription.paddle_customer_id });
        if (url) {
            window.location.href = url;
        } else {
            throw new Error("Could not generate subscription management link.");
        }
    } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
        setIsManaging(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Manage your subscription and view payment history.</CardDescription>
      </CardHeader>
      <CardContent>
        {!user ? (
            <p className="text-muted-foreground">Please log in to view your billing details.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-xl font-semibold">{subscription?.plan || 'Free'}</p>
              </div>
              <Badge variant={subscription?.plan !== 'Free' ? 'default' : 'secondary'}>
                {subscription?.plan !== 'Free' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            {subscription?.paddle_customer_id ? (
              <>
                <Button onClick={handleManageSubscription} disabled={isManaging} className="w-full">
                  {isManaging ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <ExternalLink className="mr-2 h-4 w-4" />}
                  Manage Subscription
                </Button>
                 <p className="text-xs text-muted-foreground text-center pt-2">
                    You will be redirected to Paddle to manage your subscription, update payment methods, and view billing history.
                 </p>
              </>
            ) : (
               <Button asChild className="w-full">
                <ClientLink href="/pricing">
                  Upgrade Plan
                </ClientLink>
              </Button>
            )}
            
            {!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && (
              <Alert variant="destructive">
                  <AlertTitle>Billing Not Fully Configured</AlertTitle>
                  <AlertDescription>
                      The Paddle Client Token is missing. Please add it to your environment variables to allow subscription management.
                  </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
