'use client';
import { useStytch } from '@stytch/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const AuthenticatePage = () => {
  const stytch = useStytch();
  const router = useRouter();

  useEffect(() => {
    const authenticateToken = async () => {
      try {
        await stytch.magicLinks.authenticate();
        router.replace('/dashboard');
      } catch (error) {
        console.error('Authentication failed:', error);
        router.replace('/sign-in');
      }
    };
    authenticateToken();
  }, [stytch, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p>Authenticating, please wait...</p>
      </div>
    </div>
  );
};

export default AuthenticatePage;
