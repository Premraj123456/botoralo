import { Link } from '@/components/layout/page-loader';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotCard } from '@/components/dashboard/bot-card';
import { bots } from '@/lib/data';

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold md:text-3xl">My Bots</h1>
        <Button asChild>
          <Link href="/dashboard/bots/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Bot
          </Link>
        </Button>
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
            <Button className="mt-4" asChild>
              <Link href="/dashboard/bots/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Bot
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
