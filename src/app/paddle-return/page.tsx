"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePaddle } from '@/hooks/use-paddle';

export default function PaddleReturn() {
  const paddle = usePaddle();
  const router = useRouter();

  useEffect(() => {
    if (!paddle) return;

    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('return_url');

    if (returnUrl) {
      window.location.href = returnUrl;
    } else {
      router.push('/dashboard');
    }
  }, [paddle, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Processing your payment...</p>
      </div>
    </div>
  );
}
