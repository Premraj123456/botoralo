import type { Metadata } from 'next';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Bot } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';

export const metadata: Metadata = {
  title: 'BotPilot Dashboard',
  description: 'Manage your crypto bots.',
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <Sidebar>
        <div className="flex flex-col h-full">
          <div className="flex h-16 items-center border-b border-sidebar-border px-4 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-sidebar-foreground">
              <Bot className="w-8 h-8 text-primary" />
              <span className="text-2xl">BotPilot</span>
            </Link>
          </div>
          <SidebarNav />
        </div>
      </Sidebar>
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
