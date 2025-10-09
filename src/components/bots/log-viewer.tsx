
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

type LogEntry = {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'unknown';
  message: string;
};

type LogViewerProps = {
  botId: string;
};

const levelColors: { [key in LogEntry['level']]: string } = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  unknown: "text-gray-400",
};

const parseLogLine = (line: string): Omit<LogEntry, 'id'> => {
    const timestamp = new Date().toLocaleTimeString();
    let message = line.trim();
    
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.startsWith('[error]')) {
        return { timestamp, level: 'error', message: message.substring(7).trim() };
    }
    if (lowerMessage.startsWith('[warn]')) {
        return { timestamp, level: 'warn', message: message.substring(6).trim() };
    }
    if (lowerMessage.startsWith('[info]')) {
         return { timestamp, level: 'info', message: message.substring(6).trim() };
    }
    
    // Default case for bot output that doesn't have our custom prefixes.
    return { timestamp, level: 'info', message };
};


export function LogViewer({ botId }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Ensure this effect runs only once.
    if (eventSourceRef.current) {
        return;
    }

    const url = `/api/bots/${botId}/logs`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
        setIsConnected(true);
        setLogs(prev => [{id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Log stream connected...'}]);
    };

    es.onmessage = (event) => {
        // The event data from the stream might contain multiple messages.
        // The backend formats them with 'data: ...\n\n'.
        // EventSource gives us the raw data payload.
        const rawData = event.data as string;
        
        // Split the incoming data in case multiple log lines are bundled in one event.
        const lines = rawData.split('\\n');

        const newLogs: LogEntry[] = [];
        for (const line of lines) {
            if (line.trim()) {
                newLogs.push({
                    ...parseLogLine(line),
                    id: Date.now() + Math.random(),
                });
            }
        }

        if (newLogs.length > 0) {
           setLogs(prevLogs => [...prevLogs, ...newLogs]);
        }
    };

    es.onerror = () => {
        setIsConnected(false);
        setLogs(prev => [...prev, {id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'error', message: 'Log stream disconnected. Will attempt to reconnect...'}]);
        // EventSource handles reconnection automatically. We just update the UI.
    };

    // Cleanup on component unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [botId]);
  
   useEffect(() => {
    // Auto-scroll to the bottom when new logs arrive
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [logs]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>Real-time Logs</CardTitle>
            <div className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")}></div>
                <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>
        </div>
        <CardDescription>Live output from your running bot container.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full" ref={scrollAreaRef}>
          <pre className="bg-gray-900 text-white p-4 rounded-md font-code text-sm flex flex-col gap-1">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex gap-4 items-start">
                  <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                  <span className={cn("font-bold uppercase flex-shrink-0 w-12 text-right", levelColors[log.level])}>
                    [{log.level}]
                  </span>
                  <span className="whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 animate-pulse">
                Waiting for logs...
              </div>
            )}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
