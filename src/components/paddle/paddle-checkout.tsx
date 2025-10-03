
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
  const isPaddleReady = usePaddle();

  const handleCheckout = () => {
    if (!isPaddleReady || !window.Paddle) {
        toast({ title: 'Checkout Not Ready', description: 'Please wait a moment for the checkout to load.'});
        return;
    }

    setIsProcessing(true);
    
    window.Paddle.Checkout.open({
      product: productId,
      email: email,
      passthrough: passthrough,
      successCallback: (data: any) => {
        console.log("Paddle checkout successful:", data);
        onSuccess();
      }
    });

    setTimeout(() => setIsProcessing(false), 3000);
  };

  return (
      <Button
        onClick={handleCheckout}
        disabled={!isPaddleReady || isProcessing}
        className="w-full mt-4"
      >
        {(isProcessing || !isPaddleReady) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isProcessing ? 'Processing...' : (isPaddleReady ? 'Upgrade Now' : 'Loading Billing...')}
      </Button>
  );
}
