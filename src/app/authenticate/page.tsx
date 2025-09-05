'use client';
import { useStytch } from '@stytch/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AuthenticatePage = () => {
  const stytch = useStytch();
  const router = useRouter();

  useEffect(() => {
    const authenticateToken = async () => {
      try {
        await stytch.magicLinks.authenticate(window.location.search);
        // Authentication successful, redirect to dashboard
        router.replace('/dashboard');
      } catch (error) {
        console.error('Authentication failed:', error);
        // Handle error, maybe redirect to login with an error message
        router.replace('/sign-in');
      }
    };
    authenticateToken();
  }, [stytch, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Authenticating, please wait...</p>
    </div>
  );
};

export default AuthenticatePage;
