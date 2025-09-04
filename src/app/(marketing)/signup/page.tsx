import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot } from "lucide-react";
import { Link } from '@/components/layout/page-loader';

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-grid-white/[0.05] bg-grid-black/[0.02]">
      <Card className="mx-auto max-w-sm w-full animate-fade-in-up shadow-xl">
        <CardHeader className="space-y-1 text-center">
           <Link className="flex items-center justify-center mb-4" href="/">
             <Bot className="h-8 w-8 text-primary" />
             <span className="ml-2 text-2xl font-semibold">BotPilot</span>
           </Link>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Enter your information to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required />
              </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" required />
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard">Create an account</Link>
            </Button>
             <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard">Sign up with Google</Link>
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline text-primary">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
