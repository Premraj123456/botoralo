import { Bot } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';
import { SignInForm } from '@/components/auth/sign-in-form';

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
      </div>
    </div>
  );
};

export default SignInPage;
