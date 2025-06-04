"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { debugUserDatabase, promoteUserToAdmin } from "@/lib/firebase-auth";
import { useAuth } from "@/components/firebase-auth-provider";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [repairStatus, setRepairStatus] = useState("");
  const { user } = useAuth();

  const handleDebugDatabase = async () => {
    setLoading(true);
    try {
      await debugUserDatabase();
      alert("Check the browser console for debug information");
    } catch (error) {
      console.error("Debug error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!user) {
      alert("You must be logged in");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to promote your current account (${user.email}) to admin? This action cannot be undone.`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const success = await promoteUserToAdmin(user.uid);
      if (success) {
        alert("Successfully promoted to admin! Please refresh the page.");
        window.location.reload();
      } else {
        alert("Failed to promote to admin. Check console for errors.");
      }
    } catch (error) {
      console.error("Promotion error:", error);
      alert("Error promoting to admin");
    } finally {
      setLoading(false);
    }
  };
  
  const handleRepairUserData = async () => {
    if (!user) {
      alert("You must be logged in");
      return;
    }
    
    const confirmed = confirm(
      `This will repair your user data and organization. Continue?`
    );
    
    if (!confirmed) return;
    
    setLoading(true);
    setRepairStatus("Checking user document...");
    
    try {
      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        setRepairStatus("Creating missing user document...");
        // Create user document
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.email?.split('@')[0] || "User",
          createdAt: Timestamp.now(),
          isAdmin: true,
          apiKey: "",
          role: "admin",
          organizationId: user.uid,
        });
      }
      
      setRepairStatus("Checking organization document...");
      // Check if organization exists
      const orgDoc = await getDoc(doc(db, "organizations", user.uid));
      
      if (!orgDoc.exists()) {
        setRepairStatus("Creating missing organization document...");
        // Create organization document
        await setDoc(doc(db, "organizations", user.uid), {
          name: `${user.email?.split('@')[0] || 'User'}'s Organization`,
          adminId: user.uid,
          createdAt: Timestamp.now(),
        });
      }
      
      setRepairStatus("Repair completed successfully!");
      alert("User data and organization repaired successfully! Please refresh the page.");
      window.location.reload();
    } catch (error: any) {
      console.error("Repair error:", error);
      setRepairStatus(`Error: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Debug</h1>
        
        <div className="space-y-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Current User Info</h2>
            {user ? (
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>UID:</strong> {user.uid}</p>
              </div>
            ) : (
              <p>Not logged in</p>
            )}
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Debug Actions</h2>
            <div className="space-y-4">
              <div>
                <Button
                  onClick={handleDebugDatabase}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Debugging..." : "Debug User Database"}
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  This will log all users in the database to the browser console
                </p>
              </div>

              <div>
                <Button
                  onClick={handlePromoteToAdmin}
                  disabled={loading || !user}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? "Promoting..." : "Promote Current User to Admin"}
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Warning:</strong> This will make your current account the admin. Use only if you should be the admin.
                </p>
              </div>
              
              <div>
                <Button
                  onClick={handleRepairUserData}
                  disabled={loading || !user}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? "Repairing..." : "Repair User & Organization Data"}
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Use this if you're having issues with missing user or organization documents.
                </p>
                {repairStatus && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                    {repairStatus}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Debug User Database" to see all users in the console</li>
              <li>Check if there's already an admin user</li>
              <li>If you should be the admin but aren't, click "Promote Current User to Admin"</li>
              <li>If you're having issues with inviting coworkers or logging in, click "Repair User & Organization Data"</li>
              <li>Refresh the page after any operation to see changes</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}