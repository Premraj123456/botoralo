import { Link } from '@/components/layout/page-loader';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotCard } from '@/components/dashboard/bot-card';
import { bots } from '@/lib/data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function Dashboard() {
  // Mocks for subscription data as user is not available
  const subscription = { plan: 'Free', botLimit: 1 };
  const userBots = bots;
  const canCreateBot = userBots.length < (subscription.botLimit || 0);

  const CreateBotButton = () => (
    <Button asChild disabled={!canCreateBot}>
      <Link href="/dashboard/bots/new">
        <PlusCircle className="mr-2 h-4 w-4" /> Create New Bot
      </Link>
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
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
      {bots.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
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
