
'use client';

import Script from 'next/script';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

declare global {
    interface Window {
        Paddle: any;
    }
}

interface PaddleCheckoutProps {
  priceId: string;
  userId?: string;
  email?: string;
  onLoginRequired: () => void;
}

export function PaddleCheckout({ priceId, userId, email, onLoginRequired }: PaddleCheckoutProps) {
  const [isPaddleReady, setIsPaddleReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleScriptLoad = () => {
    if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      console.error('Paddle Client Token is not configured.');
      toast({ title: 'Error', description: 'Paddle checkout is not configured.', variant: 'destructive' });
      return;
    }

    window.Paddle.Initialize({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      environment: 'sandbox',
      eventCallback: function (data: any) {
        if (data.name === 'checkout.completed') {
            setIsProcessing(false);
            // The webhook will handle the subscription update.
            // Redirecting user to a success page or dashboard.
            window.location.href = '/dashboard?subscription_success=true';
        }
      },
    });
    setIsPaddleReady(true);
  };
  
  const handleCheckout = () => {
    if (!userId || !email) {
      onLoginRequired();
      return;
    }
    
    if (!isPaddleReady) {
        toast({ title: 'Checkout Not Ready', description: 'Please wait a moment for the checkout to load.'});
        return;
    }

    setIsProcessing(true);
    window.Paddle.Checkout.open({
      items: [{ priceId: priceId, quantity: 1 }],
      customer: { email: email },
      customData: { user_id: userId },
    });
  };

  return (
    <>
      <Script
        src="https://cdn.paddle.com/v2/paddle.js"
        onLoad={handleScriptLoad}
      />
      <Button
        onClick={handleCheckout}
        disabled={!isPaddleReady || isProcessing}
        className="w-full mt-4"
      >
        {(isProcessing || !isPaddleReady) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isProcessing ? 'Processing...' : (isPaddleReady ? 'Upgrade Now' : 'Loading Billing...')}
      </Button>
    </>
  );
}

    