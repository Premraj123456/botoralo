
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createProductsAndPlans } from '@/lib/paypal/actions';
import { Loader2, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface PlanResult {
  proPlanId: string;
  powerPlanId: string;
}

export default function SetupPage() {
  const [result, setResult] = useState<PlanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Corrected: Only check for the public client ID on the client.
  // The server action will validate the secret key.
  const isPaypalConfigured = !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  const handleCreatePlans = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const planResult = await createProductsAndPlans();
      if (!planResult.proPlanId || !planResult.powerPlanId) {
        throw new Error('Failed to retrieve Plan IDs from PayPal.');
      }
      setResult(planResult);
      toast({
        title: 'Success!',
        description: 'PayPal product and plans have been created.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error Creating Plans',
        description: (error as Error).message || 'An unknown error occurred. Check your server logs and ensure both PayPal Client ID and Secret are correct in your .env file.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>One-Click PayPal Setup</CardTitle>
        <CardDescription>
          Automatically create the necessary Product and Subscription Plans in your PayPal Sandbox account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isPaypalConfigured ? (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>PayPal Client ID Missing</AlertTitle>
                <AlertDescription>
                   Please add your `NEXT_PUBLIC_PAYPAL_CLIENT_ID` to your `.env` file to use this feature. The `PAYPAL_CLIENT_SECRET` must also be set for the operation to succeed.
                </AlertDescription>
            </Alert>
        ) : (
            <div className="p-4 border-dashed border-2 rounded-lg text-center">
                <p className="text-muted-foreground mb-4">
                    This will create one product ("Botoralo") and two subscription plans ("Pro" at $9/mo, "Power" at $29/mo) using your configured PayPal API credentials.
                </p>
                <Button onClick={handleCreatePlans} disabled={isLoading}>
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Rocket className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Creating...' : 'Create PayPal Plans'}
                </Button>
            </div>
        )}

        {result && (
          <div className="space-y-4">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Action Required: Update Your .env File</AlertTitle>
              <AlertDescription>
                Copy the following Plan IDs and paste them into your `.env` file to complete the setup.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pro Plan ID</label>
              <pre className="p-3 rounded-md bg-muted font-mono text-sm overflow-x-auto">
                NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID={result.proPlanId}
              </pre>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Power Plan ID</label>
              <pre className="p-3 rounded-md bg-muted font-mono text-sm overflow-x-auto">
                NEXT_PUBLIC_PAYPAL_POWER_PLAN_ID={result.powerPlanId}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
