
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Play, Square, Trash2, Loader2 } from "lucide-react";
import { startBot, stopBot } from "@/lib/supabase/actions";
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
import { deleteBot as deleteBotAction } from "@/lib/supabase/actions";
import { events } from "@/lib/events";

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
    const [deleteState, deleteAction] = useFormState(deleteBotAction, initialState);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if(deleteState.message && !isPending){
            if(deleteState.success){
                toast({ title: "Bot Deleted", description: deleteState.message });
                router.push('/dashboard');
                router.refresh();
            } else {
                toast({ title: "Error", description: deleteState.message, variant: 'destructive' });
            }
        }
    }, [deleteState, isPending, router, toast]);

    return (
        <form action={deleteAction} className="contents">
            <input type="hidden" name="botId" value={onClick.toString()} />
             <AlertDialogAction type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Continue
            </AlertDialogAction>
        </form>
    )
}


export function BotActions({ botId, initialStatus }: BotActionsProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [startState, startAction] = useFormState(startBot, initialState);
  const [stopState, stopAction] = useFormState(stopBot, initialState);
  const [deleteState, deleteAction] = useFormState(deleteBot, initialState);

  const [isDeleting, startDeleteTransition] = useTransition();
  
  useEffect(() => {
    if (startState.message) {
      if (startState.success) {
        toast({ title: "Success", description: startState.message });
        events.emit('refresh-logs');
        router.refresh();
      } else {
        toast({ title: "Error", description: startState.message, variant: "destructive" });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startState]);
  
  useEffect(() => {
    if (stopState.message) {
      if (stopState.success) {
        toast({ title: "Success", description: stopState.message });
        router.refresh();
      } else {
        toast({ title: "Error", description: stopState.message, variant: "destructive" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopState]);

  useEffect(() => {
    if (deleteState.message && !isDeleting) {
      if (deleteState.success) {
        toast({ title: "Success", description: deleteState.message });
        router.push('/dashboard');
        router.refresh();
      } else {
        toast({ title: "Error", description: deleteState.message, variant: "destructive" });
      }
    }
  }, [deleteState, isDeleting, router, toast]);

  const handleDelete = () => {
    startDeleteTransition(() => {
        const formData = new FormData();
        formData.append('botId', botId);
        deleteAction(initialState, formData);
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
              <form action={deleteAction} className="contents">
                <input type="hidden" name="botId" value={botId} />
                <AlertDialogAction type="submit" disabled={isDeleting}>
                    {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Continue
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
