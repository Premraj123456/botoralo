"use client";

import { useStytchUser, useStytch } from "@stytch/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const UserProfilePage = () => {
  const { user, isInitialized } = useStytchUser();
  const stytch = useStytch();
  const router = useRouter();

  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  
  const handleLogout = async () => {
    await stytch.session.revoke();
    router.push('/');
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            <strong>User ID:</strong> {user.user_id}
          </p>
          <p>
            <strong>Email:</strong> {user.emails?.[0]?.email || "N/A"}
          </p>
          <Button onClick={handleLogout} className="w-full">
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
