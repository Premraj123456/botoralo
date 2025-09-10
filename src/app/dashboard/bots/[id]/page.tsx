
import { notFound } from "next/navigation";
import { getBotById, startBot, stopBot, deleteBot } from "@/lib/supabase/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Trash2, Bot as BotIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogViewer } from "@/components/bots/log-viewer";
import { Badge } from "@/components/ui/badge";
import { SummarizeLogs } from "@/components/bots/summarize-logs";
import { AnalyzeAnomalies } from "@/components/bots/analyze-anomalies";
import { SuggestFixes } from "@/components/bots/suggest-fixes";
import { getBotInfoFromBackend } from "@/lib/bot-backend/client";
import { redirect } from "next/navigation";

const statusConfig = {
  running: { text: "Running", variant: "default", className: "bg-green-500 hover:bg-green-500/90 text-white" },
  stopped: { text: "Stopped", variant: "secondary" },
  error: { text: "Error", variant: "destructive" },
};

export default async function BotDetailPage({ params }: { params: { id: string } }) {
  const bot = await getBotById(params.id);
  
  if (!bot) {
    notFound();
  }

  const backendInfo = await getBotInfoFromBackend(bot.id);
  // Sync status if backend has a different idea
  if (backendInfo && backendInfo.bot.status !== bot.status) {
    bot.status = backendInfo.bot.status;
  }
  
  // No longer need to pass logs, as the LogViewer will stream them.
  const botLogs = "";

  const status = statusConfig[bot.status as keyof typeof statusConfig] || statusConfig.stopped;

  const startBotAction = async () => {
    "use server";
    await startBot(bot.id);
  }
  
  const stopBotAction = async () => {
    "use server";
    await stopBot(bot.id);
  }

  const deleteBotAction = async () => {
    "use server";
    await deleteBot(bot.id);
    redirect('/dashboard');
  }

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
            <div className="flex gap-2">
              <form action={startBotAction}>
                <Button variant="outline" size="sm" type="submit" disabled={bot.status === 'running'}>
                  <Play className="h-4 w-4 mr-2" /> Start
                </Button>
              </form>
               <form action={stopBotAction}>
                <Button variant="outline" size="sm" type="submit" disabled={bot.status !== 'running'}>
                  <Square className="h-4 w-4 mr-2" /> Stop
                </Button>
              </form>
              <form action={deleteBotAction}>
                <Button variant="destructive" size="sm" type="submit">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </form>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="summary">AI Summary</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="fixes">Code Fix Suggestions</TabsTrigger>
        </TabsList>
        <TabsContent value="logs">
          <LogViewer botId={bot.id} />
        </TabsContent>
        <TabsContent value="summary">
          <SummarizeLogs logs={botLogs} />
        </TabsContent>
        <TabsContent value="anomalies">
          <AnalyzeAnomalies botId={bot.id} logs={botLogs} />
        </TabsContent>
        <TabsContent value="fixes">
           <SuggestFixes botCode={bot.code} botLogs={botLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
