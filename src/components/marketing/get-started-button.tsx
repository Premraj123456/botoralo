
import { Button } from "@/components/ui/button";
import { Link } from '@/components/layout/page-loader';
import { ArrowRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

interface GetStartedButtonProps {
    ctaText?: string;
}

export async function GetStartedButton({ ctaText }: GetStartedButtonProps) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const text = user ? "Go to Dashboard" : (ctaText || "Get Started Free");
  const href = user ? "/dashboard" : "/signin";

  return (
    <Button asChild size="lg" className="group glow-shadow transition-all duration-300 ease-in-out hover:glow-shadow-lg">
      <Link href={href}>
        {text}
        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Link>
    </Button>
  );
}
