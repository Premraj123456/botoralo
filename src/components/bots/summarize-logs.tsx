"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { summarizeBotLogs } from '@/ai/flows/summarize-bot-logs';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SummarizeLogs({ logs }: { logs: string }) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    setIsLoading(true);
    setSummary('');
    try {
      if (!logs) {
        setSummary("There are no logs to summarize.");
        return;
      }
      const result = await summarizeBotLogs({ botLogs: logs });
      setSummary(result.summary);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to generate summary.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Log Summary</CardTitle>
        <CardDescription>Get a quick, AI-powered summary of your bot's activity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleSummarize} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Generate Summary
        </Button>
        {summary && (
          <div className="mt-4 rounded-md border bg-muted p-4">
            <p className="text-sm whitespace-pre-wrap">{summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
