import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/supabase/actions";
import { BillingClient } from "@/components/dashboard/billing-client";

export default async function BillingPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let subscription = null;
  if (user) {
    subscription = await getUserSubscription();
  }

  return <BillingClient user={user} subscription={subscription} />;
}
