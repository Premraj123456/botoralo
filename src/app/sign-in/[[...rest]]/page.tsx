'use client';
import StytchLogin from '@stytch/nextjs';
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
            // B2B magic links require an organization_id.
            // You can get this from a URL slug, or have users select from a list.
            organizationId: "organization-live-4080055a-5b0e-47b5-9336-a74b4eac38fa", 
          }
        }
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
