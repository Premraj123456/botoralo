import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { PageLoader } from '@/components/layout/page-loader';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'BotPilot',
  description: 'Host your crypto bots without any VPS or complex setups.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body className={inter.className}>
          <PageLoader />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
