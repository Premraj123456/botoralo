
'use client';

import { useState, useEffect } from 'react';

const PADDLE_SCRIPT_URL = "https://cdn.paddle.com/v2/paddle.js";
let scriptLoading = false;
let scriptLoaded = false;

declare global {
    interface Window {
        Paddle: any;
    }
}

export function usePaddle() {
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      console.error("Paddle Client Token is not set.");
      return;
    }

    if (scriptLoaded && window.Paddle) {
      setIsPaddleReady(true);
      return;
    }

    if (scriptLoading) {
      const interval = setInterval(() => {
        if (scriptLoaded && window.Paddle) {
          clearInterval(interval);
          setIsPaddleReady(true);
        }
      }, 100);
      return () => clearInterval(interval);
    }
    
    scriptLoading = true;
    const script = document.createElement('script');
    script.src = PADDLE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (!window.Paddle) {
        console.error("Paddle script loaded but window.Paddle is not available.");
        scriptLoading = false;
        return;
      }
      
      window.Paddle.Initialize({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        environment: 'sandbox',
       });
      
      scriptLoaded = true;
      scriptLoading = false;
      setIsPaddleReady(true);
    };
    script.onerror = () => {
      console.error("Failed to load Paddle script.");
      scriptLoading = false;
    };

    document.body.appendChild(script);

    return () => {
      // Clean up the script if the component unmounts
    };
  }, []);

  return isPaddleReady;
}
