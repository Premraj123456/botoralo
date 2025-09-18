
import { Link } from '@/components/layout/page-loader';
import { PlusCircle, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotCard } from '@/components/dashboard/bot-card';
import { getUserBots, getUserSubscription } from '@/lib/supabase/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getBotInfoFromBackend } from '@/lib/bot-backend/client';
import { revalidatePath } from 'next/cache';
import { Suspense } from 'react';
import { SubscriptionRefresher } from '@/components/dashboard/subscription-refresher';

const planLimits = {
  Free: 1,
  Pro: 5,
  Power: 20,
};

export default async function Dashboard({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined }}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const subscriptionSuccess = searchParams?.subscription_success === 'true';

  if (subscriptionSuccess) {
    // If returning from a successful PayPal checkout, revalidate the path
    // to ensure the subscription data is fresh.
    revalidatePath('/dashboard');
  }

  if (!user) {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-20">
            <div className="flex flex-col items-center gap-2 text-center">
                <h3 className="text-2xl font-bold tracking-tight">Could not find user information.</h3>
                <p className="text-sm text-muted-foreground">Please try signing in again.</p>
                <div className="mt-4">
                    <Button asChild>
                        <Link href="/signin">Sign In</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
  }

  const [subscription, userBotsFromDb] = await Promise.all([
    getUserSubscription(user.id),
    getUserBots(),
  ]);

  // Fetch live backend info for each bot
  const userBots = await Promise.all(
    userBotsFromDb.map(async (bot) => {
      const backendInfo = await getBotInfoFromBackend(bot.id);
      return {
        ...bot,
        status: backendInfo?.bot.status || bot.status,
        backendInfo: backendInfo?.bot || null,
      };
    })
  );


  const botLimit = planLimits[subscription.plan as keyof typeof planLimits] || 1;
  const canCreateBot = userBots.length < botLimit;

  const CreateBotButton = () => (
    <Button asChild disabled={!canCreateBot}>
      <Link href="/dashboard/bots/new">
        <PlusCircle className="mr-2 h-4 w-4" /> Create New Bot
      </Link>
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <SubscriptionRefresher />
      </Suspense>
      {subscriptionSuccess && (
          <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Subscription Activated!</AlertTitle>
              <AlertDescription>
                  Your checkout was successful and your new plan is now active.
              </AlertDescription>
          </Alert>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">My Bots</h1>
        {canCreateBot ? (
          <CreateBotButton />
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="inline-flex">
                  <CreateBotButton />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>You've reached your bot limit. Please upgrade your plan.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {userBots.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userBots.map((bot: any) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-20">
          <div className="flex flex-col items-center gap-2 text-center">
            <h3 className="text-2xl font-bold tracking-tight">You have no bots yet</h3>
            <p className="text-sm text-muted-foreground">Get started by creating your first bot.</p>
            <div className="mt-4">
              <CreateBotButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
