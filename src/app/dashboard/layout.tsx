import type { Metadata } from 'next';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Bot } from 'lucide-react';
import { Link } from '@/components/layout/page-loader';
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
      <div className="dark:bg-grid-white/[0.05] bg-grid-black/[0.02] relative min-h-screen">
        <Sidebar>
          <div className="flex flex-col h-full">
            <div className="flex h-16 items-center border-b border-border/50 px-4 shrink-0">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
                <Bot className="w-8 h-8 text-primary" />
                <span className="text-2xl font-headline group-data-[state=collapsed]:hidden">BotPilot</span>
              </Link>
            </div>
            <SidebarNav />
          </div>
        </Sidebar>
        <div className="transition-[margin-left] duration-300 ease-in-out md:ml-14 group-data-[state=expanded]:md:ml-64">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
