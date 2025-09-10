
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Trash2, Loader2 } from "lucide-react";
import { startBot, stopBot, deleteBot } from "@/lib/supabase/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type BotStatus = "running" | "stopped" | "error";

interface BotActionsProps {
  botId: string;
  initialStatus: BotStatus;
}

export function BotActions({ botId, initialStatus }: BotActionsProps) {
  const [status, setStatus] = useState<BotStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handleStart = () => {
    startTransition(async () => {
      try {
        await startBot(botId);
        toast({ title: "Success", description: "Bot is starting..." });
        setStatus("running");
        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };

  const handleStop = () => {
    startTransition(async () => {
      try {
        await stopBot(botId);
        toast({ title: "Success", description: "Bot is stopping..." });
        setStatus("stopped");
        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteBot(botId);
        toast({ title: "Success", description: "Bot has been deleted." });
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };

  const renderButtonContent = (
    text: string,
    Icon: React.ElementType,
    action: "start" | "stop" | "delete"
  ) => {
    const isActionPending = isPending;
    return (
      <>
        {isActionPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Icon className="h-4 w-4 mr-2" />
        )}
        {text}
      </>
    );
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleStart}
        disabled={status === "running" || isPending}
      >
        {renderButtonContent("Start", Play, "start")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleStop}
        disabled={status !== "running" || isPending}
      >
        {renderButtonContent("Stop", Square, "stop")}
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={isPending}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              bot and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
