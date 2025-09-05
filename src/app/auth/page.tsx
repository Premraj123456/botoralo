import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthUI from './auth-ui';
import { Bot } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';

export default async function AuthPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none"></div>
      </div>
      <div className="z-10 flex flex-col items-center gap-8 w-full">
        <div className="text-center">
            <Link className="flex items-center justify-center mb-4" href="/">
            <Bot className="h-8 w-8 text-primary" />
            <span className="ml-3 text-3xl font-semibold tracking-wider font-headline">BotPilot</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
                Sign in or create an account to manage your bots.
            </p>
        </div>
        <AuthUI />
      </div>
    </div>
  );
}
