import { notFound } from "next/navigation";
import { getBotById } from "@/lib/appwrite/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Trash2, Bot as BotIcon, Cpu, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogViewer } from "@/components/bots/log-viewer";
import { Badge } from "@/components/ui/badge";
import { SummarizeLogs } from "@/components/bots/summarize-logs";
import { AnalyzeAnomalies } from "@/components/bots/analyze-anomalies";
import { SuggestFixes } from "@/components/bots/suggest-fixes";

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
  
  // Appwrite doesn't store logs in the bot document, so we'll use a placeholder.
  // A real implementation would fetch logs from a 'logs' collection.
  const botLogs = []; 

  const status = statusConfig[bot.status as keyof typeof statusConfig];

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
                  {/* These were mock values, will need real data source if required */}
                  {/* <span className="flex items-center gap-1 text-xs"><Cpu className="h-3 w-3" />{bot.ramUsage}MB / {bot.ramMax}MB</span> */}
                  {/* <span className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" />{bot.uptime}</span> */}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Play className="h-4 w-4 mr-2" /> Start</Button>
              <Button variant="outline" size="sm"><Square className="h-4 w-4 mr-2" /> Stop</Button>
              <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
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
          <LogViewer logs={botLogs} />
        </TabsContent>
        <TabsContent value="summary">
          <SummarizeLogs logs={botLogs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n')} />
        </TabsContent>
        <TabsContent value="anomalies">
          <AnalyzeAnomalies botId={bot.$id} logs={botLogs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n')} />
        </TabsContent>
        <TabsContent value="fixes">
           <SuggestFixes botCode={bot.code} botLogs={botLogs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
