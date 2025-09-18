'use client';

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from '@/components/layout/page-loader';
import { ArrowRight } from "lucide-react";

interface GetStartedButtonProps {
    ctaText?: string;
}

export function GetStartedButton({ ctaText }: GetStartedButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (!supabase) return;
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();
  }, [supabase]);

  return (
    <Button asChild size="lg" className="group glow-shadow transition-all duration-300 ease-in-out hover:glow-shadow-lg">
      <Link href={user ? "/dashboard" : "/signin"}>
        {ctaText ? ctaText : (user ? 'Go to Dashboard' : 'Get Started Free')}
        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Link>
    </Button>
  );
}
