
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getUserProfile, updateUserProfile } from "@/lib/supabase/actions";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot be longer than 50 characters."),
  email: z.string().email(),
  id: z.string(),
  updated_at: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  updated_at: string | null;
};

export function SettingsForm() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      id: "",
      updated_at: ""
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      const userProfile = await getUserProfile();
      if (userProfile) {
        setProfile(userProfile);
        form.reset({
          name: userProfile.full_name || "",
          email: userProfile.email || "",
          id: userProfile.id || "",
          updated_at: userProfile.updated_at ? format(new Date(userProfile.updated_at), "PPP p") : "N/A",
        });
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, [form]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateUserProfile({ name: values.name });
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-24 ml-auto" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your@email.com" {...field} disabled />
              </FormControl>
              <FormDescription>
                Your email is used for authentication and cannot be changed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User ID</FormLabel>
              <FormControl>
                <Input {...field} disabled />
              </FormControl>
              <FormDescription>
                This is your unique user identifier.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="updated_at"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Updated</FormLabel>
              <FormControl>
                <Input {...field} disabled />
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
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
