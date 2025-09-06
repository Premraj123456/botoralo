'use client';
import { StytchProvider as StytchProviderBase } from '@stytch/nextjs';
import { createStytchB2BUIClient } from '@stytch/nextjs/b2b/ui';

const stytch = createStytchB2BUIClient(process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN!);

export function StytchProvider({ children }: { children: React.ReactNode }) {
  return <StytchProviderBase stytch={stytch}>{children}</StytchProviderBase>;
}
