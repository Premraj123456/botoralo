
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createStripeBillingPortalSession, getUserSubscription } from "@/lib/stripe/actions";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {
  const [subscription, setSubscription] = useState<{ plan: string; customerId: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const sub = await getUserSubscription();
        setSubscription(sub);
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch subscription details.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubscription();
  }, [toast]);

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const { url, portalError } = await createStripeBillingPortalSession();
      if (portalError || !url) {
        throw new Error(portalError || "Could not create billing portal session.");
      }
      window.top.location.href = url;
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
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-xl font-semibold">{subscription?.plan}</p>
              </div>
              <Badge variant={subscription?.plan !== 'Free' ? 'default' : 'secondary'}>
                {subscription?.plan !== 'Free' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {subscription?.plan !== 'Free' && subscription?.customerId ? (
              <Button onClick={handleManageSubscription} disabled={isManaging} className="w-full">
                {isManaging ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Subscription & Billing
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                You are on the Free plan. Upgrade to manage your subscription.
              </p>
            )}
             <p className="text-xs text-muted-foreground text-center pt-2">
                You will be redirected to our payment provider, Stripe, to manage your subscription.
             </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
