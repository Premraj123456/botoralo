
'use client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createBrowserClient } from '@supabase/ssr';
import { Bot } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';

const SignInPage = () => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const getRedirectURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production
      process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
      'http://localhost:9002';
    // Make sure to include `https` in production
    url = url.includes('http') ? url : `https://${url}`;
    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    url = `${url}auth/callback`; // Ensure it always points to the auth callback
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
          providers={[]}
          redirectTo={getRedirectURL()}
          showLinks={true}
          view="magic_link"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Your password',
                email_input_placeholder: 'Your email address',
                password_input_placeholder: 'Your password',
                button_label: 'Send OTP',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: 'Already have an account? Sign in',
                confirmation_text: 'Check your email for the OTP'
              },
               sign_up: {
                email_label: 'Email address',
                password_label: 'Create a password',
                email_input_placeholder: 'Your email address',
                password_input_placeholder: 'Your password',
                button_label: 'Send OTP',
                social_provider_text: 'Sign up with {{provider}}',
                link_text: "Don't have an an account? Sign up",
                confirmation_text: 'Check your email for the OTP',
              },
               magic_link: {
                email_input_label: 'Email address',
                email_input_placeholder: 'Your email address',
                button_label: 'Send OTP',
                loading_button_label: 'Sending...',
                confirmation_text: 'Check your email for the one-time password'
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default SignInPage;
