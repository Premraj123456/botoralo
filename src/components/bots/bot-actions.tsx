
"use client";

import { useFormState, useFormStatus } from "react-dom";
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
import { useEffect, useState, useTransition } from "react";

type BotStatus = "running" | "stopped" | "error";

interface BotActionsProps {
  botId: string;
  initialStatus: BotStatus;
}

const initialState = {
  message: "",
  success: false,
};

function StartButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="outline"
      size="sm"
      type="submit"
      disabled={disabled || pending}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Play className="h-4 w-4 mr-2" />
      )}
      Start
    </Button>
  );
}

function StopButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      variant="outline"
      size="sm"
      type="submit"
      disabled={disabled || pending}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Square className="h-4 w-4 mr-2" />
      )}
      Stop
    </Button>
  );
}

function DeleteButton({ onClick, isPending }: { onClick: () => void, isPending: boolean }) {
    return (
        <AlertDialogAction onClick={onClick} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Continue
        </AlertDialogAction>
    )
}


export function BotActions({ botId, initialStatus }: BotActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();

  const [startState, startAction] = useFormState(startBot, initialState);
  const [stopState, stopAction] = useFormState(stopBot, initialState);
  
  useEffect(() => {
    if (startState.message) {
      if (startState.success) {
        toast({ title: "Success", description: startState.message });
        router.refresh();
      } else {
        toast({ title: "Error", description: startState.message, variant: "destructive" });
      }
    }
  }, [startState, toast, router]);
  
  useEffect(() => {
    if (stopState.message) {
      if (stopState.success) {
        toast({ title: "Success", description: stopState.message });
        router.refresh();
      } else {
        toast({ title: "Error", description: stopState.message, variant: "destructive" });
      }
    }
  }, [stopState, toast, router]);

  const handleDelete = () => {
    // Immediately redirect to the dashboard
    router.push('/dashboard');

    startDeleteTransition(async () => {
      const result = await deleteBot(botId);
      if (result.success) {
        toast({
          title: "Bot Deleted",
          description: "The bot is being removed from your dashboard.",
        });
        // The dashboard will eventually be revalidated by the server action.
        // An additional client-side refresh can ensure it's up-to-date.
        router.refresh(); 
      } else {
        toast({
          title: "Error Deleting Bot",
          description: result.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex gap-2">
      <form action={startAction}>
        <input type="hidden" name="botId" value={botId} />
        <StartButton disabled={initialStatus === "running"} />
      </form>
      <form action={stopAction}>
        <input type="hidden" name="botId" value={botId} />
        <StopButton disabled={initialStatus !== "running"} />
      </form>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
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
              <DeleteButton onClick={handleDelete} isPending={isDeleting} />
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
