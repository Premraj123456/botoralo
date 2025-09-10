
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from '@/components/layout/page-loader';
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
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
              <CardTitle className="text-3xl md:text-4xl">Privacy Policy</CardTitle>
              <CardDescription>Last updated: July 22, 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground">
              <section>
                <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
                <p>
                  We collect information that you provide directly to us, such as when you create an account, update your profile, or use the interactive features of our services. This may include your name, email address, password, and any other information you choose to provide. We also collect log information when you use our services, including the type of browser you use, access times, pages viewed, your IP address, and the page you visited before navigating to our services.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">2. Use of Information</h2>
                <p>
                  We may use the information we collect to provide, maintain, and improve our services, such as to administer your use of the services, to monitor and analyze trends, usage, and activities in connection with our services, and for any other purpose for which the information was collected. We also use it to communicate with you about products, services, offers, promotions, and provide news and information we think will be of interest to you.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">3. Sharing of Information</h2>
                <p>
                  We do not share your personal information with third parties except in the following circumstances or as otherwise described in this Privacy Policy: with your consent; with third-party vendors and other service providers who need access to your information to carry out work on our behalf; if we believe disclosure is reasonably necessary to comply with any applicable law, regulation, legal process or governmental request.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">4. Data Security</h2>
                <p>
                  We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction. Your bot's code and scripts are stored in encrypted environments and are treated as confidential data.
                </p>
              </section>
               <section>
                <h2 className="text-2xl font-semibold">5. Your Choices</h2>
                <p>
                  You may update, correct or delete information about you at any time by logging into your online account. If you wish to delete or deactivate your account, please email us at support@botoralo.app, but note that we may retain certain information as required by law or for legitimate business purposes.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">6. Changes to This Policy</h2>
                <p>
                  We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our homepage or sending you a notification).
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
