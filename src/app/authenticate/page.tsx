'use client';
import { StytchLogin } from '@stytch/nextjs/ui';
import type { StytchLoginProps } from '@stytch/nextjs/ui';
import { Products } from '@stytch/vanilla-js';
import React, { useState, useEffect } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';
import { useStytchUser } from '@stytch/nextjs';
import { useRouter } from 'next/navigation';

const AuthenticatePage = () => {
  const { user, isInitialized } = useStytchUser();
  const router = useRouter();
  const [sdkConfig, setSdkConfig] = useState<StytchLoginProps['config'] | null>(null);

  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/dashboard');
    }
  }, [user, isInitialized, router]);

  useEffect(() => {
    // We need to set the config here to ensure window.location.origin is available
    if (typeof window !== 'undefined') {
      setSdkConfig({
        products: [Products.emailMagicLinks],
        emailMagicLinksOptions: {
          loginRedirectURL: `${window.location.origin}/authenticate`,
          signupRedirectURL: `${window.location.origin}/authenticate`,
          loginExpirationMinutes: 30,
          signupExpirationMinutes: 30,
        },
      });
    }
  }, []);


  if (!isInitialized || user || !sdkConfig) {
     return (
       <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p>Loading...</p>
        </div>
       </div>
     );
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
    </div>
  );
};

export default AuthenticatePage;
