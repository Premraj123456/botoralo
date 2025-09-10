import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from '@/components/layout/page-loader';
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center bg-transparent backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <Link className="flex items-center justify-center" href="/">
          <Bot className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-semibold tracking-wider font-headline">Botoralo</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
            <Link href="/dashboard" className="text-sm font-medium text-primary">Dashboard</Link>
        </nav>
      </header>
      <main className="py-12 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl">Terms of Service</CardTitle>
              <CardDescription>Last updated: July 22, 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground">
              <section>
                <h2 className="text-2xl font-semibold">1. Introduction</h2>
                <p>
                  Welcome to Botoralo ("Company", "we", "our", "us")! These Terms of Service ("Terms") govern your use of our website located at botoralo.app (the "Service") and form a binding contractual agreement between you, the user of the Service, and us.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">2. Your Account</h2>
                <p>
                  When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                </p>
              </section>
               <section>
                <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
                <p>
                  You are solely responsible for the code, scripts, and trading strategies ("User Content") that you deploy on the Service. You agree that you will not use the Service for any unlawful purpose or to violate any laws in your jurisdiction. You are responsible for all risks associated with your trading activities.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">4. Termination</h2>
                <p>
                  We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">5. Limitation of Liability</h2>
                <p>
                  In no event shall Botoralo, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">6. Changes to Terms</h2>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">7. Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us at support@botoralo.app.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
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
        </nav>
      </footer>
    </div>
  );
}