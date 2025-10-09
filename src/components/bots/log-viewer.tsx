
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
  const trimmed = line.trim();
  const lower = trimmed.toLowerCase();

  // Remove the 'data: ' prefix if it exists
  const messageOnly = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;

  if (lower.includes('[error]'))
    return { timestamp, level: 'error', message: messageOnly.replace(/\[error\]/i, '').trim() };
  if (lower.includes('[warn]'))
    return { timestamp, level: 'warn', message: messageOnly.replace(/\[warn\]/i, '').trim() };
  if (lower.includes('[info]'))
    return { timestamp, level: 'info', message: messageOnly.replace(/\[info\]/i, '').trim() };

  return { timestamp, level: 'info', message: messageOnly };
};

export function LogViewer({ botId }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogs([]); // Clear logs on bot change
    const controller = new AbortController();
    const { signal } = controller;

    const connect = async () => {
      try {
        const response = await fetch(`/api/bots/${botId}/logs`, {
          method: 'POST',
          signal,
        });

        if (!response.body) {
          throw new Error("Response has no body");
        }
        
        setIsConnected(true);
        setLogs([{ id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Connected to log stream...' }]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          // Use regex to split by the SSE message delimiter
          const parts = buffer.split(/\n\n/);
          
          // The last part might be an incomplete message, so keep it in the buffer
          const newBuffer = parts.pop() || '';
          buffer = newBuffer;

          const newLogs: LogEntry[] = [];
          for (const part of parts) {
            if (part.trim()) {
              const lines = part.split('\n').filter(line => line.startsWith('data:'));
              for (const line of lines) {
                 const message = line.slice(5).trim();
                 if (message) {
                    newLogs.push({ ...parseLogLine(message), id: Date.now() + Math.random() });
                 }
              }
            }
          }

          if (newLogs.length > 0) {
            setLogs(prev => [...prev, ...newLogs]);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // This is an expected error when the component unmounts
        } else {
          setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'error', message: `Stream disconnected: ${(err as Error).message}.` }]);
        }
      } finally {
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      controller.abort();
    };
  }, [botId]);

  useEffect(() => {
    const logContainer = logContainerRef.current;
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
        <div ref={logContainerRef} className="bg-gray-900 text-white p-4 rounded-md font-mono text-sm space-y-1 overflow-y-auto h-[400px]">
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
