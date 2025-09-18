
'use client';

import { Bot, Terminal } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';
import { SignInForm } from '@/components/auth/sign-in-form';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

const SignInPage = () => {
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const supabase = createSupabaseClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsSupabaseConfigured(false);
      return;
    }
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            router.push('/dashboard');
        }
    };
    getSession();
  }, [supabase, router]);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md p-8 rounded-lg shadow-md border bg-card">
          <div className="flex justify-center mb-6">
            <Link className="flex items-center justify-center" href="/">
              <Bot className="h-8 w-8 text-primary" />
              <span className="ml-2 text-2xl font-semibold tracking-wider font-headline">
                Botoralo
              </span>
            </Link>
          </div>
          {!isSupabaseConfigured ? (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Supabase Not Configured</AlertTitle>
                <AlertDescription>
                  Please update your <strong>.env</strong> file with your Supabase credentials to enable authentication.
                </AlertDescription>
              </Alert>
          ) : (
            <SignInForm />
          )}
        </div>
      </div>
    </>
  );
};

export default SignInPage;
