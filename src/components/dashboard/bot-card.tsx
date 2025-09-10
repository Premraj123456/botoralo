
'use client';

import { Link } from '@/components/layout/page-loader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Bot as BotIcon, Cpu, Power, ArrowRight } from "lucide-react";
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

type Bot = {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  backendInfo: {
    memory_mb: number;
    uptime_started_at: string | null;
  } | null;
};

type BotCardProps = {
  bot: Bot;
};

const statusConfig = {
  running: { text: "Running", color: "bg-green-500" },
  stopped: { text: "Stopped", color: "bg-gray-500" },
  error: { text: "Error", color: "bg-red-500" },
};

export function BotCard({ bot }: BotCardProps) {
  const statusInfo = statusConfig[bot.status] || statusConfig.stopped;
  const [uptime, setUptime] = useState('N/A');
  const [ramUsage, setRamUsage] = useState(0);

  useEffect(() => {
    let uptimeInterval: NodeJS.Timeout | undefined;

    if (bot.status === 'running' && bot.backendInfo?.uptime_started_at) {
      const updateUptime = () => {
        const startTime = new Date(bot.backendInfo!.uptime_started_at!);
        setUptime(formatDistanceToNow(startTime, { addSuffix: true }));
      };
      
      updateUptime(); // Initial update
      uptimeInterval = setInterval(updateUptime, 10000); // Update every 10 seconds
    } else {
      setUptime('N/A');
    }

    return () => {
      if (uptimeInterval) {
        clearInterval(uptimeInterval);
      }
    };
  }, [bot.status, bot.backendInfo?.uptime_started_at]);

  useEffect(() => {
    let statsInterval: NodeJS.Timeout | undefined;
    
    const fetchStats = async () => {
        if (bot.status !== 'running') {
            setRamUsage(0);
            return;
        }
        try {
            const response = await fetch(`/api/bots/${bot.id}/stats`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                setRamUsage(data.memory_usage_mb || 0);
            }
        } catch (error) {
            console.error("Failed to fetch bot stats:", error);
            setRamUsage(0);
        }
    };

    if (bot.status === 'running') {
        fetchStats(); // Initial fetch
        statsInterval = setInterval(fetchStats, 5000); // Fetch stats every 5 seconds
    } else {
      setRamUsage(0);
    }

    return () => {
        if (statsInterval) {
            clearInterval(statsInterval);
        }
    };
  }, [bot.id, bot.status]);

  const ramMax = bot.backendInfo?.memory_mb || 128;
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
            <span>{ramUsage.toFixed(2)}MB / {ramMax}MB</span>
          </div>
        </div>
        <Progress value={ramPercentage} className="h-2" />
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild variant="outline">
          <Link href={`/dashboard/bots/${bot.id}`}>
            Manage Bot
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

    