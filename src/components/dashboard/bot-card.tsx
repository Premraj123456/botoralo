import { Link } from '@/components/layout/page-loader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Bot as BotIcon, Cpu, Power, Terminal, ArrowRight } from "lucide-react";
import type { Models } from 'appwrite';

type BotCardProps = {
  bot: Models.Document;
};

const statusConfig = {
  running: { text: "Running", color: "bg-green-500", icon: <Power className="h-4 w-4" /> },
  stopped: { text: "Stopped", color: "bg-gray-500", icon: <Power className="h-4 w-4" /> },
  error: { text: "Error", color: "bg-red-500", icon: <Power className="h-4 w-4" /> },
};

export function BotCard({ bot }: BotCardProps) {
  const statusInfo = statusConfig[bot.status as keyof typeof statusConfig] || statusConfig.stopped;
  // Mock data, as these are not in the Appwrite model
  const ramUsage = 0;
  const ramMax = 128;
  const uptime = 'N/A';
  const ramPercentage = ramMax > 0 ? (ramUsage / ramMax) * 100 : 0;

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card group">
      <CardHeader className="grid items-start gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <BotIcon className="h-6 w-6" />
            </div>
            <span>{bot.name}</span>
          </CardTitle>
          <CardDescription>
            Uptime: {uptime}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <div className={cn("h-2 w-2 rounded-full mr-2", statusInfo.color)} />
            {statusInfo.text}
          </div>
          <div className="flex items-center gap-1">
            <Cpu className="h-4 w-4" />
            <span>{ramUsage}MB / {ramMax}MB</span>
          </div>
        </div>
        <Progress value={ramPercentage} className="h-2" />
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild variant="outline">
          <Link href={`/dashboard/bots/${bot.$id}`}>
            Manage Bot
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
