
'use client';

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
        toast({ title: 'Checkout Not Ready', description: 'Please wait a moment for the billing system to load.'});
        return;
    }

    setIsProcessing(true);
    
    paddle.Checkout.open({
      items: [{
        priceId: productId,
        quantity: 1
      }],
      customer: {
        email: email,
      },
      customData: passthrough,
      events: {
        onClose: () => {
            setIsProcessing(false);
        },
        onCheckout: (data) => {
            if (data.status === 'complete') {
                console.log("Paddle checkout successful:", data);
                onSuccess();
            }
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
