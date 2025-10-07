import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Link } from '@/components/layout/page-loader';
import { revalidatePath } from 'next/cache';

export default function SubscriptionSuccessPage() {
  // Revalidate the dashboard data to reflect the new subscription.
  // This is a server-side action that ensures the dashboard is up-to-date
  // when the user navigates back to it.
  revalidatePath('/dashboard');

  return (
    <div className="flex items-center justify-center py-20">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 dark:bg-green-900/50 p-3 rounded-full w-fit">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl mt-4">Upgrade Successful!</CardTitle>
          <CardDescription>
            Your subscription has been activated. Thank you for your purchase!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
