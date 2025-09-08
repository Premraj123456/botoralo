
import { Link } from '@/components/layout/page-loader';
import { PlusCircle, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotCard } from '@/components/dashboard/bot-card';
import { getUserBots } from '@/lib/supabase/actions';
import { getUserSubscription, updatePlanFromStripeSession } from '@/lib/stripe/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { revalidatePath } from 'next/cache';

const planLimits = {
  Free: 1,
  Pro: 5,
  Power: 20,
};

// A new component to handle the server-side update
async function SubscriptionSuccess({ sessionId, userId }: { sessionId: string, userId: string }) {
  try {
    await updatePlanFromStripeSession(sessionId, userId);
    // Revalidate the path to ensure the UI updates with the new plan info
    revalidatePath('/dashboard'); 
  } catch (error) {
    console.error("Failed to update plan from Stripe session:", error);
    // Optionally, you could display an error message here
  }
  return (
    <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Subscription Updated!</AlertTitle>
        <AlertDescription>
            Your checkout was successful and your plan has been updated.
        </AlertDescription>
    </Alert>
  );
}


export default async function Dashboard({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined }}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const sessionId = searchParams?.session_id as string | undefined;

  if (!user) {
    // This should not happen due to middleware, but as a fallback
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

  // If a session_id is present, the update action will be triggered here.
  // We await it to ensure the subscription data below is fresh.
  if (sessionId) {
    await updatePlanFromStripeSession(sessionId, user.id);
  }

  const [subscription, userBots] = await Promise.all([
    getUserSubscription(user.id),
    getUserBots(),
  ]);

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
      {sessionId && (
          <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Subscription Updated!</AlertTitle>
              <AlertDescription>
                  Your checkout was successful and your plan has been updated.
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
