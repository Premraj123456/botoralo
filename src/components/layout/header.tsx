import { Button } from '@/components/ui/button';
import { type User } from '@stackframe/stack';
import { Link } from './page-loader';
import { LogOut } from 'lucide-react';
import { stackServerApp } from '@stackframe/stack/next-server';

async function signOutAction() {
  'use server';
  const stack = await stackServerApp();
  await stack.signOut();
}

export function Header({ user }: { user: User | null }) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
      <div className="w-full flex-1">
        {/* Optional: Add search or other header elements here */}
      </div>
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            {user.displayName}
          </span>
          <form action={signOutAction}>
            <Button variant="outline" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </div>
      ) : (
        <Button asChild>
          <Link href="/sign-in">
            Sign In
          </Link>
        </Button>
      )}
    </header>
  )
}
