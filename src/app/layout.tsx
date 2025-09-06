import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Source_Code_Pro } from 'next/font/google';
import { PageLoader } from '@/components/layout/page-loader';
import { StytchPublicProvider } from '@/lib/stytch/StytchProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sourceCodePro = Source_Code_Pro({ subsets: ['latin'], variable: '--font-source-code-pro' });


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
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${sourceCodePro.variable}`} suppressHydrationWarning>
        <StytchPublicProvider>
          <PageLoader />
          {children}
          <Toaster />
        </StytchPublicProvider>
      </body>
    </html>
  );
}
