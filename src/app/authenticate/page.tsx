
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

  const customTheme = {
    ...ThemeSupa,
    default: {
      ...ThemeSupa.default,
      colors: {
        ...ThemeSupa.default.colors,
        brand: 'hsl(262.1 83.3% 57.8%)',
        brandAccent: 'hsl(262.1 83.3% 57.8%)',
        brandButtonText: 'white',
        defaultButtonBackground: 'hsl(222 47% 11%)',
        defaultButtonBackgroundHover: 'hsl(217.2 32.6% 17.5%)',
        defaultButtonBorder: 'hsl(217.2 32.6% 17.5%)',
        defaultButtonText: 'white',
        dividerBackground: 'hsl(217.2 32.6% 17.5%)',
        inputBackground: 'transparent',
        inputBorder: 'hsl(217.2 32.6% 17.5%)',
        inputBorderHover: 'hsl(262.1 83.3% 57.8%)',
        inputBorderFocus: 'hsl(262.1 83.3% 57.8%)',
        inputText: 'white',
        inputLabelText: 'white',
        inputPlaceholder: 'hsl(215 20.2% 65.1%)',
        messageText: 'hsl(215 20.2% 65.1%)',
        messageTextDanger: 'hsl(0 62.8% 30.6%)',
        anchorTextColor: 'hsl(215 20.2% 65.1%)',
        anchorTextHoverColor: 'white',
      },
       radii: {
        borderRadiusButton: 'var(--radius)',
        buttonBorderRadius: 'var(--radius)',
        inputBorderRadius: 'var(--radius)',
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md p-8 rounded-lg shadow-md border bg-card">
        <div className="flex justify-center mb-6">
            <Link className="flex items-center justify-center" href="/">
            <Bot className="h-8 w-8 text-primary" />
            <span className="ml-2 text-2xl font-semibold tracking-wider font-headline">BotPilot</span>
            </Link>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: customTheme }}
          theme="dark"
          providers={['google', 'github']}
          redirectTo={getRedirectURL()}
        />
      </div>
    </div>
  );
};

export default AuthenticatePage;
