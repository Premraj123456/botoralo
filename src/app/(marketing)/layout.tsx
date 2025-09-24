
import { Bot } from "lucide-react";
import { Link } from '@/components/layout/page-loader';
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none"></div>
         <div className="absolute top-[-20%] left-[10%] w-[40rem] h-[40rem] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
         <div className="absolute bottom-[-20%] right-[10%] w-[40rem] h-[40rem] bg-secondary/30 rounded-full blur-[150px] animate-pulse delay-500" />
      </div>
      <header className="px-4 lg:px-6 h-16 flex items-center bg-transparent backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <Link className="flex items-center justify-center" href="/">
          <Bot className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-semibold tracking-wider font-headline">Botoralo</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
            <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">Pricing</Link>
            <Link href="/#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground">FAQ</Link>
            <Button asChild size="sm">
                <Link href="/signin">Get Started</Link>
            </Button>
        </nav>
      </header>
      <main className="flex-1 z-10">{children}</main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/50 z-10">
        <p className="text-xs text-muted-foreground">
          © 2024 Botoralo. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/refund">
            Refund Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
