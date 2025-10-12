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

const levelColors: Record<LogEntry['level'], string> = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  unknown: "text-gray-400",
};

const parseLogLine = (line: string): Omit<LogEntry, 'id'> => {
  const timestamp = new Date().toLocaleTimeString();
  const messageOnly = line.trim();
  const lower = messageOnly.toLowerCase();

  if (lower.startsWith('[error]'))
    return { timestamp, level: 'error', message: messageOnly.slice(7).trim() };
  if (lower.startsWith('[warn]'))
    return { timestamp, level: 'warn', message: messageOnly.slice(6).trim() };
  if (lower.startsWith('[info]'))
    return { timestamp, level: 'info', message: messageOnly.slice(6).trim() };

  return { timestamp, level: 'info', message: messageOnly };
};


export function LogViewer({ botId }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(`[LogViewer] Initializing for bot ID: ${botId}`);
    setLogs([]);
    const controller = new AbortController();
    const { signal } = controller;

    const connect = async () => {
      console.log("[LogViewer] Attempting to connect to stream...");
      try {
        const response = await fetch(`/api/bots/${botId}/logs`, {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });

        if (!response.ok) {
          throw new Error(`Fetch failed with status ${response.status}`);
        }
        if (!response.body) {
          throw new Error("Response has no body");
        }
        
        console.log("[LogViewer] Stream connected successfully.");
        setIsConnected(true);
        setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Connected to log stream...' }]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("[LogViewer] Stream finished.");
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          console.log("[LogViewer DEBUG] Received chunk:", JSON.stringify(chunk));
          buffer += chunk;
          
          console.log("[LogViewer DEBUG] Buffer content:", JSON.stringify(buffer));

          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            const message = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 2);

            console.log("[LogViewer DEBUG] Processing message part:", JSON.stringify(message));

            if (message.startsWith('data:')) {
              const data = message.substring(5).trim();
              if (data) {
                const newLog = { ...parseLogLine(data), id: Date.now() + Math.random() };
                console.log("[LogViewer] Adding new log to state:", newLog);
                setLogs(prev => [...prev, newLog]);
              }
            }
            boundary = buffer.indexOf('\n\n');
          }
           console.log("[LogViewer DEBUG] New buffer for incomplete part:", JSON.stringify(buffer));
        }

      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("[LogViewer] Stream error:", err);
          setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'error', message: `Stream disconnected: ${(err as Error).message}.` }]);
        } else {
            console.log("[LogViewer] Stream connection aborted as requested.");
        }
      } finally {
        console.log("[LogViewer] Set isConnected to false.");
        setIsConnected(false);
        if (!signal.aborted) {
          setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'warn', message: 'Stream ended.' }]);
        }
      }
    };

    connect();

    return () => {
      console.log("[LogViewer] Cleanup: Aborting stream connection.");
      controller.abort();
    };
  }, [botId]);

  useEffect(() => {
    const logContainer = scrollRef.current;
    if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
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
        <div ref={scrollRef} className="bg-gray-900 text-white p-4 rounded-md font-mono text-sm space-y-1 overflow-y-auto h-[400px]">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="flex gap-3">
                <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                <span className={cn("font-bold uppercase w-14 text-right flex-shrink-0", levelColors[log.level])}>
                  [{log.level}]
                </span>
                <span className="whitespace-pre-wrap break-words">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 animate-pulse">Waiting for logs...</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
