import { useState, useEffect } from 'react';

const PADDLE_SCRIPT_URL = "https://cdn.paddle.com/v2/paddle.js";
let scriptLoading = false;
let scriptLoaded = false;

export function usePaddle() {
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  useEffect(() => {
    // If Paddle is already initialized, we're ready
    if (window.Paddle) {
      setIsPaddleReady(true);
      return;
    }

    // If script is already loaded, just initialize
    if (scriptLoaded) {
      window.Paddle.Initialize({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        environment: 'sandbox',
         eventCallback: function (data: any) {
            if (data.name === 'checkout.completed') {
                window.location.href = '/dashboard?subscription_success=true';
            }
         }
      });
      setIsPaddleReady(true);
      return;
    }

    // If script is currently loading, wait for it to finish
    if (scriptLoading) {
      const interval = setInterval(() => {
        if (window.Paddle) {
          clearInterval(interval);
          setIsPaddleReady(true);
        }
      }, 100);
      return () => clearInterval(interval);
    }
    
    // Otherwise, load the script
    scriptLoading = true;
    const script = document.createElement('script');
    script.src = PADDLE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      if (!window.Paddle) {
        console.error("Paddle script loaded but window.Paddle is not available.");
        return;
      }
      window.Paddle.Initialize({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        environment: 'sandbox',
        eventCallback: function (data: any) {
            if (data.name === 'checkout.completed') {
                 // The webhook will handle the subscription update, but we redirect the user.
                window.location.href = '/dashboard?subscription_success=true';
            }
         }
      });
      setIsPaddleReady(true);
    };
    script.onerror = () => {
      console.error("Failed to load Paddle script.");
      scriptLoading = false;
    };

    document.body.appendChild(script);

    return () => {
      // Clean up the script if the component unmounts, though this is unlikely for a shared hook
      // and might be undesirable if other components are using it.
      // For simplicity in a SPA-like app, we leave it.
    };
  }, []);

  return isPaddleReady;
}
