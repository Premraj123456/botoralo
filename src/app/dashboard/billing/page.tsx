
'use client';

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserSubscription } from "@/lib/supabase/actions";
import { Badge } from "@/components/ui/badge";
import { Link } from '@/components/layout/page-loader';
import { createSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { manageSubscription } from "@/lib/paddle/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BillingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<{ plan: string; paddle_subscription_id: string | null } | null>(null);
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
        setIsLoading(false);
      }
    };
    getSessionAndSubscription();
  }, [supabase, fetchSubscription]);
  
  const handleManageSubscription = async () => {
    if (!subscription?.paddle_subscription_id) {
        toast({ title: "Error", description: "No subscription ID found to manage.", variant: "destructive" });
        return;
    }
    setIsManaging(true);
    try {
        const { url } = await manageSubscription(subscription.paddle_subscription_id);
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
            
            {subscription?.paddle_subscription_id ? (
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
                <Link href="/pricing">
                  Upgrade Plan
                </Link>
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

    