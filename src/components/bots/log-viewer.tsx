import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Log } from "@/lib/types";

type LogViewerProps = {
  logs: Log[];
};

const levelColors = {
  info: "text-blue-400",
  warn: "text-yellow-400",
  error: "text-red-400",
};

export function LogViewer({ logs }: LogViewerProps) {
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
              <div className="text-gray-500">No logs to display.</div>
            )}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
