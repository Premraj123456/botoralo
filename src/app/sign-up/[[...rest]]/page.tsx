'use client';
import { StytchLogin } from '@stytch/nextjs';
import { StytchLoginConfig } from '@stytch/vanilla-js';
import React from 'react';

const sdkConfig: StytchLoginConfig = {
  products: ['emailMagicLinks', 'oauth'],
  emailMagicLinksOptions: {
    loginRedirectURL: '/authenticate',
    signupRedirectURL: '/authenticate',
    loginExpirationMinutes: 30,
    signupExpirationMinutes: 30,
  },
  oauthOptions: {
    providers: [{ type: 'google' }],
    loginRedirectURL: '/authenticate',
    signupRedirectURL: '/authenticate',
  },
};

const Page = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 rounded-lg shadow-md border bg-card">
         <StytchLogin config={sdkConfig} />
      </div>
    </div>
  );
};

export default Page;
