"use client";

import { Button } from '@/components/ui/button';
import { Link } from './page-loader';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { logout } from '@/lib/appwrite/auth';
import type { Models } from 'appwrite';

export function Header({ user }: { user: Models.User<Models.Preferences> | null }) {
    const router = useRouter();

    const handleSignOut = async () => {
        await logout();
        router.push('/sign-in');
        router.refresh();
    };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 backdrop-blur-sm">
      <div className="w-full flex-1">
        {/* Optional: Add search or other header elements here */}
      </div>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              Settings
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => router.push('/dashboard/billing')}>
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
