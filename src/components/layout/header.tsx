"use client";

import { Button } from '@/components/ui/button';
import { Link } from './page-loader';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useStytch, useStytchUser } from '@stytch/nextjs';
import { useRouter } from 'next/navigation';

export function Header() {
    const { user } = useStytchUser();
    const stytch = useStytch();
    const router = useRouter();

    const getInitials = () => {
        const email = user?.emails?.[0]?.email;
        if (email) {
            return email.charAt(0).toUpperCase();
        }
        return 'U';
    }
    
    const signOut = async () => {
        await stytch.session.revoke();
        router.push('/');
    }

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
                <AvatarFallback>{getInitials()}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.emails?.[0]?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/settings">
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
            </Link>
             <Link href="/dashboard/billing">
              <DropdownMenuItem>
                Billing
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
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
