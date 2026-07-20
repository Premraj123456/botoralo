"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Paddle: any;
  }
}

export function PaddleProvider() {
  useEffect(() => {
    const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const paddleEnvironment = process.env.NODE_ENV;

     const isLocal = window.location.hostname === "localhost";

    if (!paddleToken) {
      console.error("Paddle token is not configured.");
      return;
    }

    if (isLocal && paddleToken.startsWith("paddletoken_live")) {
      console.warn("Paddle: Live token on localhost — skipping to avoid ProfitWell hang.");
      return;
    }
    
    if (!paddleToken) {
      console.error("Paddle token is not configured.");
      return;
    }

    if (document.getElementById('paddle-js')) {
      return;
    }

    const script = document.createElement("script");
    script.id = 'paddle-js';
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      if (window.Paddle) {
        window.Paddle.Environment.set(paddleEnvironment);
        window.Paddle.Setup({
          token: paddleToken,
        });
        console.log("Paddle.js [info]: Initialized in sandbox mode.");
      }
    };
    script.onerror = () => {
        console.error("Failed to load Paddle script.");
    };
    document.body.appendChild(script);
  }, []);

  return null;
}
