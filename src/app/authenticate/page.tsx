
'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

const AuthenticatePage = () => {
  const supabase = createSupabaseClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
            router.replace('/dashboard');
        }
        setLoading(false);
      }
    );

    // Initial check
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
            router.replace('/dashboard');
        }
        setLoading(false);
    };
    checkUser();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const getRedirectURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production
      process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
      'http://localhost:9002/';
    // Make sure to include `https` in production
    url = url.includes('http') ? url : `https://${url}`;
    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    url = `${url}auth/callback`;
    return url;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
       <div className="absolute top-8">
        <Link className="flex items-center justify-center" href="/">
          <Bot className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-semibold tracking-wider font-headline">BotPilot</span>
        </Link>
      </div>
      <div className="w-full max-w-md p-8 rounded-lg shadow-md border bg-card">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={['google', 'github']}
          redirectTo={getRedirectURL()}
        />
      </div>
    </div>
  );
};

export default AuthenticatePage;
