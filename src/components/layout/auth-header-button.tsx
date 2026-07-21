"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function AuthHeaderButton() {
  const [user, setUser] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(!!data.user);
    });
  }, []);

  if (user === null) {
    return <Button asChild size="sm"><Link href="/signin">Get Started</Link></Button>;
  }

  return (
    <Button asChild size="sm">
      <Link href={user ? "/dashboard" : "/signin"}>{user ? "Dashboard" : "Get Started"}</Link>
    </Button>
  );
}
