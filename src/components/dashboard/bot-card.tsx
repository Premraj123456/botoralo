import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Bot } from "@/lib/types";
import { Bot as BotIcon, Cpu, Power, Terminal } from "lucide-react";

type BotCardProps = {
  bot: Bot;
};

const statusConfig = {
  running: { text: "Running", color: "bg-green-500", icon: <Power className="h-4 w-4" /> },
  stopped: { text: "Stopped", color: "bg-gray-500", icon: <Power className="h-4 w-4" /> },
  error: { text: "Error", color: "bg-red-500", icon: <Power className="h-4 w-4" /> },
};

export function BotCard({ bot }: BotCardProps) {
  const { text, color } = statusConfig[bot.status];
  const ramPercentage = (bot.ramUsage / bot.ramMax) * 100;

  return (
    <Card>
      <CardHeader className="grid items-start gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <BotIcon className="h-6 w-6" />
            <span>{bot.name}</span>
          </CardTitle>
          <CardDescription>
            Uptime: {bot.uptime}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <span className={cn("flex h-2 w-2 shrink-0 translate-y-px rounded-full mr-2", color)} />
            {text}
          </div>
          <div className="flex items-center gap-1">
            <Cpu className="h-4 w-4" />
            <span>{bot.ramUsage}MB / {bot.ramMax}MB</span>
          </div>
        </div>
        <Progress value={ramPercentage} className="mt-2 h-2" />
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={`/dashboard/bots/${bot.id}`}>
            <Terminal className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
