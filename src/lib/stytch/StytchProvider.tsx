'use client';
import { StytchProvider as StytchProviderBase, useStytchMember } from '@stytch/nextjs/b2b';
import { createStytchB2BUIClient } from '@stytch/nextjs/b2b/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const stytch = createStytchB2BUIClient(process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!);

export function StytchPublicProvider({ children }: { children: React.ReactNode }) {
  return <StytchProviderBase stytch={stytch}>{children}</StytchProviderBase>;
}

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { member, isInitialized } = useStytchMember();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !member) {
      router.push('/sign-in');
    }
  }, [member, isInitialized, router]);

  if (!isInitialized || !member) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}


export function StytchProtectedProvider({ children }: { children: React.ReactNode }) {
    return (
        <StytchProviderBase stytch={stytch}>
            <ProtectedContent>{children}</ProtectedContent>
        </StytchProviderBase>
    );
}
