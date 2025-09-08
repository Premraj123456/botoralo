import { Link } from '@/components/layout/page-loader';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotCard } from '@/components/dashboard/bot-card';
import { getUserBots } from '@/lib/supabase/actions';
import { getUserSubscription } from '@/lib/stripe/actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SubscriptionRefresher } from '@/components/dashboard/subscription-refresher';

const planLimits = {
  Free: 1,
  Pro: 5,
  Power: 20,
};

export default async function Dashboard() {
  const [subscription, userBots] = await Promise.all([
    getUserSubscription(),
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
      <SubscriptionRefresher />
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
