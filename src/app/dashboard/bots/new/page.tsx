"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Save, Loader2, Info } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createBot } from "@/lib/supabase/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import React from "react";

const botFormSchema = z.object({
  name: z.string().min(3, "Bot name must be at least 3 characters."),
  codeFile: z
    .custom<FileList>()
    .refine((files) => files?.length > 0, "A code file or .zip archive is required.")
    .refine((files) => files?.[0]?.size <= 10 * 1024 * 1024, `Max file size is 10MB.`),
});

type BotFormValues = z.infer<typeof botFormSchema>;


export default function NewBotPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<BotFormValues>({
    resolver: zodResolver(botFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: BotFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("codeFile", values.codeFile[0]);

    startTransition(async () => {
        try {
            const newBot = await createBot(formData);
            toast({ title: "Success", description: "Your bot is being deployed." });
            router.push(`/dashboard/bots/${newBot.id}`);
        } catch (error) {
            console.error("Create bot error:", error);
            toast({
                title: "Deployment Failed",
                description: (error as Error).message || "Could not create the bot.",
                variant: "destructive",
            });
        }
    });
  };


  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Bot className="h-6 w-6" />
            Create a New Bot
          </CardTitle>
          <CardDescription>
            Upload your bot's code file (e.g., `bot.py`, `index.js`) or a `.zip` archive to deploy it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important Notes</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>For Python, flush output for real-time logs (e.g., `sys.stdout.flush()`).</li>
                    <li>For projects, include `requirements.txt` (Python) or `package.json` (Node.js).</li>
                    <li>The entrypoint will be auto-detected (e.g. `main.py`, `bot.py`, `npm start`).</li>
                  </ul>
                </AlertDescription>
              </Alert>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Awesome Bot" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codeFile"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Bot Code (Single File or .zip)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept=".py,.js,.ts,.zip"
                        onChange={(e) => onChange(e.target.files)} 
                        {...rest} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Deploy Bot
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
