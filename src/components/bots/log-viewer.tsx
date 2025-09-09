
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Log } from "@/lib/types";
import { useEffect, useState, useRef } from "react";

type LogViewerProps = {
  logs: Log[]; // Initial logs, can be empty
  botId: string;
};

const levelColors = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

export function LogViewer({ logs: initialLogs, botId }: LogViewerProps) {
  const [logs, setLogs] = useState<Log[]>(initialLogs);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // This is a placeholder for where you would initiate a connection to your backend's log stream
    // For example, using EventSource (Server-Sent Events) or WebSockets.
    // The current implementation just shows initial logs.
    // A real implementation would connect to an endpoint like `/api/bots/${botId}/logs`
    
    // Example with a mock EventSource:
    // const es = new EventSource(`/api/bots/${botId}/logs`);
    // es.onmessage = (event) => {
    //   const newLog = JSON.parse(event.data);
    //   setLogs((prevLogs) => [...prevLogs, newLog]);
    // };
    // eventSourceRef.current = es;

    // return () => {
    //   es.close();
    // };

  }, [botId]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <pre className="bg-gray-900 text-white p-4 rounded-md font-code text-sm">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <span className="text-gray-500">{log.timestamp}</span>
                  <span className={cn("font-bold", levelColors[log.level])}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span>{log.message}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-500">
                Log streaming is not implemented in this demo.
                <br />
                A production implementation would connect to the backend's log stream for this bot.
              </div>
            )}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
