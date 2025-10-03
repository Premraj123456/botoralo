
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaddle } from '@/hooks/use-paddle';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const isPaddleReady = usePaddle();

  const handleCheckout = () => {
    if (!userId || !email) {
      onLoginRequired();
      return;
    }
    
    if (!isPaddleReady || !window.Paddle) {
        toast({ title: 'Checkout Not Ready', description: 'Please wait a moment for the checkout to load.'});
        return;
    }

    setIsProcessing(true);
    window.Paddle.Checkout.open({
      items: [{ priceId: priceId, quantity: 1 }],
      customer: { email: email },
      customData: { user_id: userId },
    });
    // The eventCallback in usePaddle will handle isProcessing state and redirects,
    // but we'll set processing to false after a delay in case the user closes the modal.
    setTimeout(() => setIsProcessing(false), 2000);
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
