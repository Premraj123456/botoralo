
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserSubscription } from '@/lib/supabase/actions';
import { PricingClient } from '@/components/marketing/pricing-client';

export default async function PricingPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let subscription = null;
  // We only need to check subscription if user exists
  if (user) {
    subscription = await getUserSubscription();
  }


  return (
    <div className="py-12 md:py-20 lg:py-24 z-10 relative">
      <div className="container mx-auto px-4 md:px-6 flex flex-col gap-12 items-center">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Choose the perfect plan for your bots
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Simple, transparent pricing. No hidden fees. Cancel anytime.
          </p>
        </div>
        <PricingClient user={user} subscription={subscription} />
      </div>
    </div>
  );
}
