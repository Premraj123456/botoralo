
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

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
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);
  const [demoError, setDemoError] = useState(false);
  const { toast } = useToast();
  const supabase = createSupabaseClient();
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
    if (!supabase) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
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
    if (!supabase) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: values.otp,
        type: 'email',
      });

      if (error) {
        throw error;
      }
      
      if (data.session) {
        toast({
          title: "Success!",
          description: "You have been successfully signed in. Redirecting...",
        });
        router.push('/dashboard');
        router.refresh(); // Force a refresh to ensure layout re-renders with user state
      } else {
        throw new Error("Could not sign you in. Please try again.");
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Invalid or expired OTP.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!supabase) return;
    setIsDemoSubmitting(true);
    setDemoError(false);
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email: 'demo@user.com',
            password: 'password',
        });
        if (error) {
            setDemoError(true);
            throw error;
        }
        router.push('/dashboard');
        router.refresh();
    } catch (error) {
        console.error("Demo login failed", error);
    } finally {
        setIsDemoSubmitting(false);
    }
  }

  const renderForms = () => {
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
          <Button type="submit" className="w-full" disabled={isSubmitting || isDemoSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
            Sign In with OTP
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <div>
        {demoError && (
            <Alert variant="destructive" className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Demo Login Failed</AlertTitle>
                <AlertDescription>
                    Please create a user in your Supabase project with the email <strong>demo@user.com</strong> and password <strong>password</strong> to enable this feature.
                </AlertDescription>
            </Alert>
        )}
        {renderForms()}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>
        <Button variant="secondary" className="w-full" onClick={handleDemoLogin} disabled={isDemoSubmitting || isSubmitting}>
            {isDemoSubmitting && <Loader2 className="mr-2 animate-spin" />}
            Demo Direct Login
        </Button>
    </div>
  );
}
