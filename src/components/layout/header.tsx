"use client";

import { Button } from '@/components/ui/button';
import { Link } from './page-loader';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';


export function Header({ user }: { user: { displayName: string } | null }) {
    const router = useRouter();

    const handleSignOut = async () => {
        // In a real app, you would call your auth provider's sign out method
        console.log("Signing out...");
        router.push('/sign-in');
    };

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
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
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
