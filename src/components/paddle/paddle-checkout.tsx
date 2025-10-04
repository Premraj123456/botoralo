
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaddle } from '@/hooks/use-paddle';

interface PaddleCheckoutProps {
  productId: string;
  email?: string;
  passthrough?: object;
  onSuccess: () => void;
}

export function PaddleCheckout({ productId, email, passthrough, onSuccess }: PaddleCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const paddle = usePaddle();

  const handleCheckout = () => {
    if (!paddle) {
        toast({ title: 'Checkout Not Ready', description: 'Please wait a moment for the billing system to load or refresh the page.'});
        return;
    }

    setIsProcessing(true);

    const successUrl = `${window.location.origin}/dashboard/subscription-success`;
    
    paddle.Checkout.open({
      items: [{
        price_id: productId,
        quantity: 1
      }],
      customer: {
        email: email,
      },
      customData: passthrough,
      settings: {
        successUrl: successUrl,
      },
      events: {
        onClose: () => {
            setIsProcessing(false);
        },
        onCheckout: (data: any) => {
            // This event is deprecated, but we keep it for broader compatibility.
            // The primary success handling should be done via webhooks.
            if (data.status === 'complete') {
                console.log("Paddle checkout successful (onCheckout event):", data);
                onSuccess();
            }
        },
        onComplete: (data: any) => {
            // This is the recommended event for v2.
            console.log("Paddle checkout successful (onComplete event):", data);
            // The successUrl will handle the redirect, but we can call onSuccess as a backup.
            onSuccess();
        }
      }
    });

    // Reset processing state as a fallback if the modal is closed unexpectedly
    setTimeout(() => {
        if (isProcessing) {
            setIsProcessing(false);
        }
    }, 5000);
  };

  const isPaddleReady = !!paddle;

  return (
      <Button
        onClick={handleCheckout}
        disabled={!isPaddleReady || isProcessing}
        className="w-full mt-4"
        variant="default"
      >
        {(isProcessing || !isPaddleReady) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isProcessing ? 'Processing...' : (isPaddleReady ? 'Upgrade Now' : 'Loading Billing...')}
      </Button>
  );
}
