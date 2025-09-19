
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from '@/components/layout/page-loader';
import { Bot } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
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
                  We collect information that you provide to us directly, such as when you create an account, and information that is automatically collected when you use our services, such as your IP address and usage data. The primary information we collect is your email address for authentication and the code you provide for your trading bots.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
                <p>
                  We use your information to provide, maintain, and improve our services, including to host and run your trading bots, to process payments, to communicate with you, and to secure your account. Your bot code is treated as confidential and is only accessed by our automated systems for the purpose of execution.
                </p>
              </section>
               <section>
                <h2 className="text-2xl font-semibold">3. Data Security</h2>
                <p>
                  We implement a variety of security measures to maintain the safety of your personal information and your bot code. Your code is stored in encrypted repositories, and bots are executed in isolated, sandboxed environments to prevent unauthorized access.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">4. Data Retention</h2>
                <p>
                  We retain your information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements. Bot logs are retained for a limited period to assist with debugging and then are permanently deleted.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">5. Third-Party Services</h2>
                <p>
                  We use third-party services like Supabase for authentication and database management, and PayPal for payment processing. These services have their own privacy policies, and we encourage you to review them. We do not sell or trade your personal information to outside parties.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">6. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">7. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at support@botoralo.app.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
