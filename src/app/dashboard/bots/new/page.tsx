
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

const botFormSchema = z.object({
  name: z.string().min(3, "Bot name must be at least 3 characters."),
  codeFile: z
    .custom<FileList>()
    .refine((files) => files?.length > 0, "A code file is required.")
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, `Max file size is 5MB.`),
});

type BotFormValues = z.infer<typeof botFormSchema>;


export default function NewBotPage() {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<BotFormValues>({
    resolver: zodResolver(botFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: BotFormValues) => {
    try {
      const file = values.codeFile[0];
      const code = await file.text();

      const newBot: { id: string } | null = await createBot({ name: values.name, code });
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
            Upload your bot's code file (e.g., `bot.py` or `index.js`) to deploy it in seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important Logging Note</AlertTitle>
                <AlertDescription>
                  For real-time logs, ensure your Python scripts flush their output (e.g., using `sys.stdout.flush()` after a print statement).
                </AlertDescription>
              </Alert>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Discord Bot" {...field} />
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
                    <FormLabel>Bot Code File</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept=".py,.js,.ts"
                        onChange={(e) => onChange(e.target.files)} 
                        {...rest} 
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

    