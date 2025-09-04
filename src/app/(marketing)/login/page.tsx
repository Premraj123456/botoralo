import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot } from "lucide-react";
import { Link } from '@/components/layout/page-loader';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-grid-white/[0.05] bg-grid-black/[0.02]">
      <Card className="mx-auto max-w-sm w-full animate-fade-in-up shadow-xl">
        <CardHeader className="space-y-1 text-center">
           <Link className="flex items-center justify-center mb-4" href="/">
             <Bot className="h-8 w-8 text-primary" />
             <span className="ml-2 text-2xl font-semibold">BotPilot</span>
           </Link>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required defaultValue="demo@botpilot.app" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm text-primary hover:underline">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required defaultValue="password" />
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard">Login</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
               <Link href="/dashboard">Login with Google</Link>
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
