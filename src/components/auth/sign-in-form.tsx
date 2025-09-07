"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { signInWithOtp, verifyOtp } from "@/lib/supabase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits.").max(6, "OTP must be 6 digits."),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export function SignInForm() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const handleEmailSubmit = async (values: EmailFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithOtp(values.email);
      if (error) {
        throw new Error(error);
      }
      setEmail(values.email);
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Check your email for the one-time password.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (values: OtpFormValues) => {
    setIsSubmitting(true);
    try {
      // Supabase sends different OTP types for sign-up vs. sign-in.
      // We'll try both to ensure a smooth flow for new and returning users.
      let result;
      // First, try verifying as a returning user
      result = await verifyOtp(email, values.otp, 'magiclink');
      if (result.error) {
          // If that fails, try as a new user
         result = await verifyOtp(email, values.otp, 'signup');
      }

      if (result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Success!",
        description: "You have been successfully signed in.",
      });
      router.push("/dashboard");
      router.refresh(); // Important to re-fetch server components and update session state
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "otp") {
    return (
      <Form {...otpForm}>
        <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
           <p className="text-sm text-center text-muted-foreground">
            An OTP has been sent to <strong>{email}</strong>.
          </p>
          <FormField
            control={otpForm.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>One-Time Password</FormLabel>
                <FormControl>
                  <Input placeholder="123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
            Verify & Sign In
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...emailForm}>
      <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6">
        <FormField
          control={emailForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
          Sign In with OTP
        </Button>
      </form>
    </Form>
  );
}
