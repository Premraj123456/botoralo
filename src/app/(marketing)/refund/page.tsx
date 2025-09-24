
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RefundPolicyPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="py-12 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl">Refund Policy</CardTitle>
              <CardDescription>Last updated: July 22, 2024</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground prose prose-invert prose-p:text-muted-foreground prose-headings:text-foreground">
              <section>
                <h2 className="text-2xl font-semibold">1. Overview</h2>
                <p>
                  This Refund Policy applies to all subscription plans for the Botoralo bot hosting service. We aim to provide a fair and transparent refund process for our users.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">2. Subscription Cancellations</h2>
                <p>
                  You can cancel your subscription at any time through your billing settings. When you cancel, your subscription will remain active until the end of your current billing cycle. You will not be charged for subsequent cycles. We do not provide prorated refunds for cancellations made mid-cycle.
                </p>
              </section>
               <section>
                <h2 className="text-2xl font-semibold">3. Eligibility for a Refund</h2>
                <p>
                  We offer a 7-day money-back guarantee for new users on their first subscription payment. If you are not satisfied with our service, you may request a full refund within 7 days of your initial purchase. This guarantee does not apply to subscription renewals.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">4. How to Request a Refund</h2>
                <p>
                  To request a refund, please contact our support team at support@botoralo.app within the 7-day eligibility period. Please include your account email and the reason for your request. Refunds are processed within 5-10 business days to the original method of payment.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">5. Exceptions</h2>
                <p>
                  Refunds will not be issued for accounts that have violated our Terms of Service. After the 7-day guarantee period, subscription payments are non-refundable.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold">6. Contact Us</h2>
                <p>
                  If you have any questions about our Refund Policy, please contact us at support@botoralo.app.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
