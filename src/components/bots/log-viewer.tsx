
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

  if (lower.startsWith('[error]'))
    return { timestamp, level: 'error', message: trimmed.slice(7).trim() };
  if (lower.startsWith('[warn]'))
    return { timestamp, level: 'warn', message: trimmed.slice(6).trim() };
  if (lower.startsWith('[info]'))
    return { timestamp, level: 'info', message: trimmed.slice(6).trim() };

  return { timestamp, level: 'info', message: trimmed };
};

export function LogViewer({ botId }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const connect = async () => {
      try {
        const res = await fetch(`/api/bots/${botId}/logs`, { 
            method: 'POST', // Use POST to match the backend
            signal 
        });
        if (!res.body) throw new Error("No response body");

        setIsConnected(true);
        setLogs(prev => [...prev, { id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Connected to log stream...' }]);

        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += value;

          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";

          const newLogs: LogEntry[] = [];
          for (const line of lines) {
            if (!line.trim()) continue;

            if (line.startsWith("data:")) {
              const message = line.replace(/^data:\s*/, "");
              if (message && message !== "[DONE]") {
                newLogs.push({ ...parseLogLine(message), id: Date.now() + Math.random() });
              }
            }
          }

          if (newLogs.length > 0) {
            setLogs(prev => [...prev, ...newLogs]);
          }
        }

        setIsConnected(false);
        setLogs(prev => [
          ...prev,
          { id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'warn', message: 'Stream ended.' },
        ]);

      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Stream error:", err);
          setIsConnected(false);
          setLogs(prev => [
            ...prev,
            { id: Date.now(), timestamp: new Date().toLocaleTimeString(), level: 'error', message: `Stream disconnected: ${err.message}` },
          ]);
        }
      }
    };

    connect();
    return () => controller.abort();
  }, [botId]);

  // Auto-scroll to bottom when new logs come in
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
        <ScrollArea className="h-[400px] w-full">
          <div ref={scrollRef} className="bg-gray-900 text-white p-4 rounded-md font-mono text-sm space-y-1 overflow-y-auto h-[400px]">
            {logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                  <span className={cn("font-bold uppercase w-14 text-right", levelColors[log.level])}>
                    [{log.level}]
                  </span>
                  <span className="whitespace-pre-wrap break-words">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 animate-pulse">Waiting for logs...</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
