import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Source_Code_Pro } from 'next/font/google';
import { PageLoader, NProgressProvider } from '@/components/layout/page-loader';
import { PaddleProvider } from '@/components/paddle/paddle-provider';
import { Suspense } from 'react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
});

export const metadata: Metadata = {
  title: 'Botoralo - 24/7 Bot Hosting',
  description: 'The easiest way to host your Discord and Telegram bots. Keep your bots alive 24/7 without the hassle of managing a VPS.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className={`${inter.variable} ${sourceCodePro.variable} dark`}>
      <body className="font-body">
        <NProgressProvider>
          <Suspense fallback={null}>
            <PageLoader />
          </Suspense>
          {children}
          <Toaster />
          <PaddleProvider />
        </NProgressProvider>
      </body>
    </html>
  );
}
