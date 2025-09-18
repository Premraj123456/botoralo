
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Save, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createBot } from "@/lib/supabase/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const botFormSchema = z.object({
  name: z.string().min(3, "Bot name must be at least 3 characters."),
  code: z.string().min(10, "Bot code must be at least 10 characters."),
});

type BotFormValues = z.infer<typeof botFormSchema>;

const exampleCode = `import time
import sys
import random

print("[info] Test bot starting up...")
sys.stdout.flush()
time.sleep(2)

counter = 0
while True:
    print(f"[info] Heartbeat count: {counter}")
    
    if counter % 5 == 0 and counter > 0:
        print("[warn] This is a periodic warning message.")
    
    if random.random() < 0.05:
        print("[error] A simulated random error occurred!")
        
    sys.stdout.flush()
    counter += 1
    time.sleep(3)
`;

export default function NewBotPage() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<BotFormValues>({
    resolver: zodResolver(botFormSchema),
    defaultValues: {
      name: "",
      code: exampleCode,
    },
  });

  const onSubmit = async (values: BotFormValues) => {
    try {
      const newBot: { id: string } | null = await createBot(values);
      if (newBot) {
        toast({ title: "Success", description: "Your bot has been deployed." });
        router.push(`/dashboard/bots/${newBot.id}`);
      } else {
        throw new Error("Failed to create bot.");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: (error as Error).message || "Something went wrong.",
        variant: "destructive",
      });
    }
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
            Use the example logging script below or paste your own code to deploy a new bot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Log Test Bot" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot Code</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your bot script here..."
                        className="font-mono min-h-[300px] text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
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
