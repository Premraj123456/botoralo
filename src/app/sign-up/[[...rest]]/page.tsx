'use client';
import { StytchLogin } from '@stytch/nextjs/ui';
import type { StytchLoginConfig } from '@stytch/nextjs';
import React from 'react';
import { Bot } from 'lucide-react';
import Link from 'next/link';

const Page = () => {
  const [sdkConfig, setSdkConfig] = React.useState<StytchLoginConfig | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const redirectURL = `${window.location.origin}/authenticate`;
      setSdkConfig({
        products: ['emailMagicLinks'],
        emailMagicLinksOptions: {
          loginRedirectURL: redirectURL,
          signupRedirectURL: redirectURL,
          loginExpirationMinutes: 30,
          signupExpirationMinutes: 30,
        },
      });
    }
  }, []);


  if (!sdkConfig) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="absolute top-8">
        <Link className="flex items-center justify-center" href="/">
          <Bot className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-semibold tracking-wider font-headline">BotPilot</span>
        </Link>
      </div>
      <div className="w-full max-w-md p-8 rounded-lg shadow-md border bg-card">
         <StytchLogin config={sdkConfig} />
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default Page;
