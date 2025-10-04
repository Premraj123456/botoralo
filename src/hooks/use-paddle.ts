
'use client';

import { useState, useEffect } from 'react';
import { initializePaddle, Paddle } from '@paddle/paddle-js';

let paddlePromise: Promise<Paddle | undefined> | null = null;

export function usePaddle() {
  const [paddle, setPaddle] = useState<Paddle | undefined>();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      console.error("Paddle Client Token is not set in environment variables.");
      return;
    }

    if (!paddlePromise) {
      paddlePromise = initializePaddle({
        environment: 'sandbox',
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      });
    }

    paddlePromise
      .then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
        }
      })
      .catch((error) => {
        console.error("Failed to initialize Paddle:", error);
        paddlePromise = null; // Reset promise on failure
      });
  }, []);

  return paddle;
}
