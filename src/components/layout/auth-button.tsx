'use client';

import { createClient } from '@/lib/supabase/client';
import { type User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AuthButton({ user }: { user: User | null }) {
  const router = useRouter();

  const handleSignIn = () => {
    router.push('/auth');
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground hidden sm:inline-block">
        {user.email}
      </span>
      <Button variant="outline" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  ) : (
    <Button onClick={handleSignIn}>Sign In</Button>
  );
}
