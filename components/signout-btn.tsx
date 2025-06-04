"use client";

import { Button } from "@/components/ui/button";
import { signOutUser } from "@/lib/firebase-auth";
import { clearSessionCookie } from "@/lib/client-auth";
import { useRouter } from "next/navigation";
import { useToast } from "./ui/use-toast";

export default function SignOutButton() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const result = await signOutUser();
    
    if (result && "message" in result) {
      toast({
        title: "Error signing out",
        description: result.message,
        variant: "destructive",
      });
    } else {
      // Clear session cookie on signout
      clearSessionCookie();
      router.push("/login");
    }
  };

  return (
    <Button
      className="w-24"
      variant="destructive"
      onClick={handleSignOut}
    >
      Sign Out
    </Button>
  );
}
