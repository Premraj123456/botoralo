'use client';
import { StytchLogin } from '@stytch/nextjs';
import type { StytchLoginConfig } from '@stytch/vanilla-js';
import React from 'react';

const Page = () => {
  const [sdkConfig, setSdkConfig] = React.useState<StytchLoginConfig | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const redirectURL = `${window.location.origin}/authenticate`;
      setSdkConfig({
        products: ['emailMagicLinks', 'oauth'],
        emailMagicLinksOptions: {
          loginRedirectURL: redirectURL,
          signupRedirectURL: redirectURL,
          loginExpirationMinutes: 30,
          signupExpirationMinutes: 30,
        },
        oauthOptions: {
          providers: [{ type: 'google' }],
          loginRedirectURL: redirectURL,
          signupRedirectURL: redirectURL,
        },
      });
    }
  }, []);


  if (!sdkConfig) {
    return null; // or a loading spinner
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 rounded-lg shadow-md border bg-card">
         <StytchLogin config={sdkConfig} />
      </div>
    </div>
  );
};

export default Page;
