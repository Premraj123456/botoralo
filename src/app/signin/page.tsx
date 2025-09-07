
import { Bot } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';
import { SignInForm } from '@/components/auth/sign-in-form';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const SignInPage = async ({ searchParams }: { searchParams: { error?: string } }) => {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md p-8 rounded-lg shadow-md border bg-card">
        <div className="flex justify-center mb-6">
          <Link className="flex items-center justify-center" href="/">
            <Bot className="h-8 w-8 text-primary" />
            <span className="ml-2 text-2xl font-semibold tracking-wider font-headline">
              BotPilot
            </span>
          </Link>
        </div>
        {searchParams.error === 'demo_login_failed' && (
            <Alert variant="destructive" className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Demo Login Failed</AlertTitle>
                <AlertDescription>
                    Please create a user in your Supabase project with the email <strong>demo@user.com</strong> and password <strong>password</strong> to enable this feature.
                </AlertDescription>
            </Alert>
        )}
        <SignInForm />
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>
         <form action="/auth/demo" method="post" className="w-full">
            <Button variant="secondary" className="w-full" type="submit">
                Demo Direct Login
            </Button>
         </form>
      </div>
    </div>
  );
};

export default SignInPage;
