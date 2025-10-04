
'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Paddle: any;
  }
}

/**
 * A hook to access the initialized Paddle instance.
 * The PaddleProvider component is responsible for loading and initializing the script.
 */
export function usePaddle() {
  const [paddle, setPaddle] = useState<any>();

  useEffect(() => {
    // The Paddle script is loaded asynchronously by PaddleProvider.
    // We check for its existence on the window object.
    if (window.Paddle) {
      setPaddle(window.Paddle);
    }
    
    // It's possible the component using this hook mounts before the script is loaded.
    // A more robust solution could involve a global state/context updated by PaddleProvider.
    // For now, we assume the script loads quickly.
    const interval = setInterval(() => {
        if (window.Paddle && !paddle) {
            setPaddle(window.Paddle);
            clearInterval(interval);
        }
    }, 100);

    return () => clearInterval(interval);

  }, [paddle]);

  return paddle;
}
