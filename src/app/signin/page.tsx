import { Bot } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';
import { SignInForm } from '@/components/auth/sign-in-form';
import { Button } from '@/components/ui/button';

const SignInPage = () => {
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
         <Button asChild variant="secondary" className="w-full">
          <Link href="/dashboard">
            Demo Direct Login
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default SignInPage;
