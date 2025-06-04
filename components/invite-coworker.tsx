"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createCoworkerAccount } from "@/lib/firebase-auth";

export default function InviteCoworker() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createCoworkerAccount(email, password, name);
      
      if ("message" in result) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Coworker Invited Successfully",
          description: `Account created for ${name}. Share the credentials with them.`,
        });
        
        // Reset form
        setEmail("");
        setPassword("");
        setName("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create coworker account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Invite Coworker</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="coworker-name">Coworker Name</Label>
          <Input
            id="coworker-name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="coworker-email">Email</Label>
          <Input
            id="coworker-email"
            type="email"
            placeholder="john@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="coworker-password">Temporary Password</Label>
          <Input
            id="coworker-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating Account..." : "Create Coworker Account"}
        </Button>
      </form>
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> After creating the account, manually share the email and password with your coworker so they can log in.
        </p>
      </div>
    </div>
  );
}