
"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { createPayPalSubscription, capturePayPalSubscription } from "@/lib/paypal/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface PayPalButtonsWrapperProps {
  planName: 'Pro' | 'Power';
  userId?: string;
  onLoginRequired: () => void;
}

export function PayPalButtonsWrapper({ planName, userId, onLoginRequired }: PayPalButtonsWrapperProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const payPalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

  const handleCreateSubscription = async (data: any, actions: any) => {
    if (!userId) {
      onLoginRequired();
      // Throwing an error here stops the PayPal flow
      throw new Error("User not logged in.");
    }
    
    try {
      // Pass the plan NAME to the server action
      const subscription = await createPayPalSubscription(planName, userId);
      if (subscription.id) {
        return subscription.id;
      }
      throw new Error("Could not create subscription.");
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Could not initiate PayPal checkout. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleOnApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      // Pass only the subscription ID and user ID to the capture action
      const result = await capturePayPalSubscription(data.subscriptionID, userId!);
      if (result.success) {
        toast({
          title: "Success!",
          description: "Your subscription has been activated.",
        });
        // Redirect to dashboard with a success flag
        router.push('/dashboard?subscription_success=true');
      } else {
        throw new Error(result.error || "Failed to activate subscription.");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to process payment. Please contact support.",
        variant: "destructive",
      });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleOnError = (err: any) => {
    console.error("PayPal Checkout onError", err);
    toast({
      title: "Error",
      description: "An error occurred during checkout. Please try again.",
      variant: "destructive",
    });
  }

  if (!payPalClientId) {
    return null; // Don't render if client ID is not set
  }
  
  if (isProcessing) {
      return (
          <div className="flex items-center justify-center h-10 w-full mt-4">
              <Loader2 className="h-6 w-6 animate-spin" />
          </div>
      )
  }

  return (
    <PayPalScriptProvider options={{
      "clientId": payPalClientId,
      "intent": "subscription",
      "vault": true,
      "enable-funding": "card"
    }}>
      <PayPalButtons
        style={{ layout: "vertical", label: "subscribe" }}
        createSubscription={handleCreateSubscription}
        onApprove={handleOnApprove}
        onError={handleOnError}
      />
    </PayPalScriptProvider>
  );
}
