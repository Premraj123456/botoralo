"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeLogsAndAlert } from '@/ai/flows/alert-on-anomalous-events';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AnalyzeLogsOutput } from '@/ai/flows/alert-on-anomalous-events';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AnalyzeAnomalies({ botId, logs }: { botId: string; logs: string }) {
  const [result, setResult] = useState<AnalyzeLogsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      if (!logs) {
        setResult({ isAnomalous: false, alertMessage: "There are no logs to analyze." });
        return;
      }
      const analysisResult = await analyzeLogsAndAlert({ botId, logs });
      setResult(analysisResult);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to analyze logs for anomalies.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Anomaly Detection</CardTitle>
        <CardDescription>Scan bot logs for unusual errors, security risks, or unexpected behavior.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleAnalysis} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
          Scan for Anomalies
        </Button>
        {result && (
          <Alert variant={result.isAnomalous ? "destructive" : "default"}>
            {result.isAnomalous ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            <AlertTitle>{result.isAnomalous ? "Anomaly Detected!" : "No Anomalies Found"}</AlertTitle>
            <AlertDescription>
              {result.alertMessage || "The AI scan completed and found no unusual activity in the logs."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
