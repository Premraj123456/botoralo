'use client';
import { StytchLogin } from '@stytch/nextjs';
import type { StytchLoginProps } from '@stytch/nextjs';
import { Products } from '@stytch/vanilla-js';
import React, { useState, useEffect } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';
import { useStytch, useStytchUser } from '@stytch/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

const AuthenticatePage = () => {
  const { user, isInitialized } = useStytchUser();
  const stytch = useStytch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sdkConfig, setSdkConfig] = useState<StytchLoginProps['config'] | null>(null);

  useEffect(() => {
    if (stytch && !user && isInitialized) {
      const token = searchParams.get('token');
      const tokenType = searchParams.get('stytch_token_type');
      if (token && tokenType === 'magic_links') {
        stytch.magicLinks.authenticate(token, {
          session_duration_minutes: 60,
        }).then(() => {
            // The useStytchUser hook will trigger the redirect to dashboard
        }).catch(err => {
            console.error("Authentication failed:", err);
        });
      }
    }
  }, [isInitialized, searchParams, stytch, user]);

  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/dashboard');
    }
  }, [user, isInitialized, router]);

  useEffect(() => {
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


  if (!isInitialized || user) {
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
        {sdkConfig && <StytchLogin config={sdkConfig} />}
      </div>
    </div>
  );
};

export default AuthenticatePage;
