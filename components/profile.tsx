"use client";

import { useAuth } from "./firebase-auth-provider";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ApiKeyManager from "./api-key-manager";
import { UserIcon } from "lucide-react";
import SignOutButton from "./signout-btn";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Profile() {
  const { user, loading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setIsAdmin(data.isAdmin || false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  if (loading || !user) return null;

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" size="sm">
            <UserIcon className="w-5 h-5 sm:hidden flex" />
            <span className="sm:flex hidden">My account</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>My account {isAdmin && "(Admin)"}</DialogTitle>
            <div className="pt-8 pb-4 flex flex-col gap-6">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" disabled value={user.email || ""} />
              </div>
              
              <ApiKeyManager />
              
              <div className="pt-4 border-t">
                <SignOutButton />
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
