"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function SubscriptionRefresher() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get('subscription_success');

  useEffect(() => {
    if (success === 'true') {
      // Use router.refresh() to re-fetch server components and update state
      // without losing client-side state like scroll position.
      router.refresh();
    }
  }, [success, router]);

  // This component does not render anything
  return null;
}
