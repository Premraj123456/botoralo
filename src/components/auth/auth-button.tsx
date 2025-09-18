'use client';

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from '@/components/layout/page-loader';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    };
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  if (loading) {
    return <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />;
  }
  
  return user ? (
    <Button asChild size="sm">
      <Link href="/dashboard">Dashboard</Link>
    </Button>
  ) : (
    <Button asChild size="sm">
      <Link href="/signin">Get Started</Link>
    </Button>
  );
}
