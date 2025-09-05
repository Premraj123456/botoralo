
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { seedStripeProducts } from '@/lib/stripe/actions';
import { Loader2, Rocket } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function SeedProductsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      const result = await seedStripeProducts();
      if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'Success!',
        description: 'Stripe products and prices have been created and your .env file has been updated. You may need to refresh the pricing page.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to seed Stripe products.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
        <Card>
        <CardHeader>
            <CardTitle>Seed Stripe Products</CardTitle>
            <CardDescription>
            This page will create the necessary Products and Prices in your Stripe account
            to match the subscription plans offered in this application. It will then
            update your local `.env` file with the new Price IDs.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>One-Time Setup Required</AlertTitle>
                <AlertDescription>
                    To fix pricing page errors, please click the button below. This will sync your application with your Stripe account.
                </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground mb-4">
            Click the button below to begin. This is a one-time setup step.
            </p>
            <Button onClick={handleSeed} disabled={isLoading}>
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Rocket className="mr-2 h-4 w-4" />
            )}
            Create Products & Update Environment
            </Button>
        </CardContent>
        </Card>
    </div>
  );
}
