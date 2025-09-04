"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { suggestCodeFixes } from '@/ai/flows/suggest-code-fixes';
import { Code, Lightbulb, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SuggestCodeFixesOutput } from '@/ai/flows/suggest-code-fixes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


export function SuggestFixes({ botCode, botLogs }: { botCode: string; botLogs: string }) {
  const [result, setResult] = useState<SuggestCodeFixesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSuggest = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      if (!botLogs) {
        toast({ title: "No logs to analyze", description: "The bot must have logs to suggest fixes."});
        return;
      }
      const suggestionResult = await suggestCodeFixes({ botCode, botLogs });
      setResult(suggestionResult);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to generate code fix suggestions.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const severityConfig = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Code Fix Suggestions</CardTitle>
        <CardDescription>Based on the logs and your bot's code, the AI can suggest improvements and fixes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleSuggest} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
          Suggest Fixes
        </Button>
        {result && result.suggestions.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            {result.suggestions.map((suggestion, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>
                  <div className='flex items-center gap-2'>
                    <Badge className={cn("text-primary-foreground", severityConfig[suggestion.severity])}>{suggestion.severity}</Badge>
                    <span className='font-semibold'>{suggestion.errorType}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold">Error Message:</h4>
                      <p className="font-code text-sm text-muted-foreground">{suggestion.errorMessage}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Suggested Fix:</h4>
                      <pre className="bg-gray-900 text-white p-4 mt-2 rounded-md font-code text-sm overflow-x-auto">
                        <code>{suggestion.codeFixSuggestion}</code>
                      </pre>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        {result && result.suggestions.length === 0 && (
          <p className="text-sm text-muted-foreground">No specific code fixes could be identified from the logs.</p>
        )}
      </CardContent>
    </Card>
  );
}
