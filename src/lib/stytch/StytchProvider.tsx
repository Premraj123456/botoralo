'use client';
import { StytchProvider, useStytchUser } from '@stytch/nextjs';
import { createStytchUIClient } from '@stytch/nextjs/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const stytch = createStytchUIClient(process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!);

export function StytchPublicProvider({ children }: { children: React.ReactNode }) {
  return <StytchProvider stytch={stytch}>{children}</StytchProvider>;
}

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useStytchUser();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/sign-in');
    }
  }, [user, isInitialized, router]);

  if (!isInitialized || !user) {
    return (
       <div className="flex items-center justify-center h-screen w-full">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p>Loading session...</p>
            </div>
        </div>
    );
  }

  return <>{children}</>;
}

export function StytchProtectedProvider({ children }: { children: React.ReactNode }) {
    return (
        <StytchProvider stytch={stytch}>
            <ProtectedContent>{children}</ProtectedContent>
        </StytchProvider>
    );
}
