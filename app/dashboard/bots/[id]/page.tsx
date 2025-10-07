
import { notFound } from "next/navigation";
import { getBotById } from "@/lib/supabase/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot as BotIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogViewer } from "@/components/bots/log-viewer";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { SummarizeLogs } from "@/components/bots/summarize-logs";
import { AnalyzeAnomalies } from "@/components/bots/analyze-anomalies";
import { SuggestFixes } from "@/components/bots/suggest-fixes";
import { getBotInfoFromBackend } from "@/lib/bot-backend/client";
import { BotActions } from "@/components/bots/bot-actions";

type StatusConfig = {
  [key: string]: {
    text: string;
    variant: BadgeProps["variant"];
    className?: string;
  };
};


const statusConfig: StatusConfig = {
  running: { text: "Running", variant: "default", className: "bg-green-500 hover:bg-green-500/90 text-white" },
  stopped: { text: "Stopped", variant: "secondary" },
  error: { text: "Error", variant: "destructive" },
  starting: { text: "Starting", variant: "default", className: "bg-yellow-500 hover:bg-yellow-500/90 text-white animate-pulse" },
};

export default async function BotDetailPage({ params }: { params: { id: string } }) {
  const bot = await getBotById(params.id);
  
  if (!bot) {
    notFound();
  }

  const backendInfo = await getBotInfoFromBackend(bot.id);
  // Sync status if backend has a different idea
  let currentStatus = bot.status;
  if (backendInfo && backendInfo.bot.status !== bot.status) {
    currentStatus = backendInfo.bot.status;
  }
  
  // NOTE: The `code` and `logs` fields are no longer passed down to AI components.
  // This is because the bot code is not stored in the DB anymore, and logs are streamed.
  // These components will need to be updated if AI features are to be re-enabled.

  const status = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.stopped;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BotIcon className="h-10 w-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">{bot.name}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-1">
                  <Badge variant={status.variant} className={status.className}>{status.text}</Badge>
                </CardDescription>
              </div>
            </div>
            <BotActions botId={bot.id} initialStatus={bot.status as "running" | "stopped" | "error"} />
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="summary" disabled>AI Summary</TabsTrigger>
          <TabsTrigger value="anomalies" disabled>Anomaly Detection</TabsTrigger>
          <TabsTrigger value="fixes" disabled>Code Fix Suggestions</TabsTrigger>
        </TabsList>
        <TabsContent value="logs">
          <LogViewer botId={bot.id} />
        </TabsContent>
        <TabsContent value="summary">
          <SummarizeLogs logs={""} />
        </TabsContent>
        <TabsContent value="anomalies">
          <AnalyzeAnomalies botId={bot.id} logs={""} />
        </TabsContent>
        <TabsContent value="fixes">
           <SuggestFixes botCode={""} botLogs={""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    