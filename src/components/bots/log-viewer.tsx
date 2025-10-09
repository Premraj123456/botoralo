
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
    // The incoming line might still have the "data: " prefix from the stream.
    const message = line.startsWith('data:') ? line.substring(5).trim() : line.trim();
    const lowerMessage = message.toLowerCase();

    // Check for explicit prefixes from our own stream messages
    if (lowerMessage.startsWith('[error]')) {
        return { timestamp, level: 'error', message: message.substring(7).trim() };
    }
    if (lowerMessage.startsWith('[warn]')) {
        return { timestamp, level: 'warn', message: message.substring(6).trim() };
    }
    if (lowerMessage.startsWith('[info]')) {
         return { timestamp, level: 'info', message: message.substring(6).trim() };
    }
    
    // Default case for any log line that doesn't match the above (e.g., from the bot itself).
    return { timestamp, level: 'info', message };
};


export function LogViewer({ botId }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      const es = new EventSource(`/api/bots/${botId}/logs`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setLogs(prev => {
          if (prev.length > 0 && prev[prev.length - 1]?.message.includes('Log stream connected')) {
            return prev;
          }
          return [...prev, {id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Log stream connected...'}];
        });
      };

      es.onmessage = (event) => {
        if (event.data) {
          // Robustly handle cases where multiple SSE messages are bundled into one event.data
          const messageChunk = event.data.replace(/\\n\\n/g, '\n\n');
          const lines = messageChunk.split('\n\n');
      
          const newLogs = lines
            .map(line => {
                // Remove the "data: " prefix and trim whitespace
                const cleanLine = line.replace(/^data:\s*/, '').trim();
                if (cleanLine) {
                    return {
                        ...parseLogLine(cleanLine),
                        id: Date.now() + Math.random(),
                    };
                }
                return null;
            })
            .filter((log): log is LogEntry => log !== null);

          if (newLogs.length > 0) {
            setLogs(prevLogs => [...prevLogs, ...newLogs]);
          }
        }
      };
      
      es.onerror = (err) => {
        setIsConnected(false);
        setLogs(prev => [...prev, {id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'error', message: 'Log stream disconnected. Retrying...'}]);
        es.close();
        setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);
  
   useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
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
