'use client';
import { StytchB2B } from '@stytch/nextjs/b2b';
import type { StytchB2BUIConfig } from '@stytch/vanilla-js';
import React from 'react';

const Page = () => {
  const [sdkConfig, setSdkConfig] = React.useState<StytchB2BUIConfig | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const redirectURL = `${window.location.origin}/authenticate`;
      setSdkConfig({
        products: ['emailMagicLinks'],
        b2bOptions: {
          magicLinksOptions: {
            loginRedirectURL: redirectURL,
            signupRedirectURL: redirectURL,
            loginExpirationMinutes: 30,
            signupExpirationMinutes: 30,
            organizationId: "organization-live-4080055a-5b0e-47b5-9336-a74b4eac38fa", 
          }
        }
      });
    }
  }, []);


  if (!sdkConfig) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 rounded-lg shadow-md border bg-card">
         <StytchB2B.EmailMagicLinks config={sdkConfig} />
      </div>
    </div>
  );
};

export default Page;
