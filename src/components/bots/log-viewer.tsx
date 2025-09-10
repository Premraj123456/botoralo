
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
    
    line = line.replace(/^data: /m, '').trim();

    if (line.toLowerCase().includes('error')) {
        return { timestamp, level: 'error', message: line };
    }
    if (line.toLowerCase().includes('warn')) {
        return { timestamp, level: 'warn', message: line };
    }
    if (line.startsWith('[error streaming logs]')) {
         return { timestamp, level: 'error', message: line };
    }
    if (line.startsWith('[info]')) {
         return { timestamp, level: 'info', message: line.substring(6) };
    }
    
    return { timestamp, level: 'info', message: line };
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
        setLogs(prev => [...prev, {id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Log stream connected...'}]);
      };

      es.onmessage = (event) => {
        const newLog = parseLogLine(event.data);
        setLogs((prevLogs) => [...prevLogs, { ...newLog, id: Date.now() + Math.random() }]);
      };
      
      es.onerror = (err) => {
        setIsConnected(false);
        setLogs(prev => [...prev, {id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'error', message: 'Log stream disconnected. Retrying...'}]);
        es.close();
        // Optional: Implement a retry mechanism
        setTimeout(connect, 5000); // Retry after 5 seconds
      };
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [botId]);
  
   useEffect(() => {
    if (scrollAreaRef.current) {
      // A bit of a hack to scroll to the bottom of the scroll area viewport
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
