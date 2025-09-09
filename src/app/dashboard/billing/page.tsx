
'use client';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createStripeBillingPortalSession, getUserSubscription } from "@/lib/stripe/actions";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/layout/page-loader";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BillingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<{ plan: string; customerId: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const { toast } = useToast();
  const supabase = createSupabaseClient();

  const fetchSubscription = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const sub = await getUserSubscription(userId);
      setSubscription(sub);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch subscription details.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    };
    const getSessionAndSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSubscription(session.user.id);
      } else {
        setIsLoading(false); // No user, so stop loading
      }
    };
    getSessionAndSubscription();
  }, [supabase, fetchSubscription]);

  const handleManageSubscription = async () => {
    if (!user) {
        toast({ title: "Not logged in", description: "You must be logged in to manage your subscription.", variant: "destructive" });
        return;
    }
    setIsManaging(true);
    try {
      const { url, portalError } = await createStripeBillingPortalSession(user.id);
      if (portalError || !url) {
        throw new Error(portalError || "Could not create billing portal session.");
      }
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      setIsManaging(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Manage your subscription and view payment history.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>One-Time Setup for Billing Portal</AlertTitle>
            <AlertDescription>
                To manage your subscription, you must first configure your Customer Portal in Stripe.
                <a href="https://dashboard.stripe.com/test/settings/billing/portal" target="_blank" rel="noopener noreferrer" className="text-primary underline font-medium ml-1">
                    Configure it here.
                </a>
            </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !user ? (
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
            {subscription?.plan !== 'Free' && subscription?.customerId ? (
              <>
                <Button onClick={handleManageSubscription} disabled={isManaging} className="w-full">
                  {isManaging ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Manage Subscription & Billing
                </Button>
                 <p className="text-xs text-muted-foreground text-center pt-2">
                    You will be redirected to our payment provider, Stripe, to manage your subscription.
                 </p>
              </>
            ) : (
               <Button asChild className="w-full">
                <Link href="/pricing">
                  Upgrade Plan
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
