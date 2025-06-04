"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./firebase";
import { getDoc, doc } from "firebase/firestore";
import { cache } from "react";

// Define user type
export type FirebaseUser = {
  id: string;
  email: string | null;
  isAdmin: boolean;
  role: string;
  name?: string;
  apiKey?: string;
};

// Server-side function to check if user is authenticated
export const getUser = cache(async (): Promise<FirebaseUser | null> => {
  const sessionCookie = cookies().get("session")?.value;
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    // Try to parse as JSON first (new format)
    try {
      const sessionData = JSON.parse(sessionCookie);
      
      // Return user object with role information
      return {
        id: sessionData.userId,
        email: sessionData.email,
        isAdmin: sessionData.isAdmin || false,
        role: sessionData.role || 'coworker',
        name: sessionData.name,
        apiKey: undefined, // API key would be fetched separately if needed
      };
    } catch (parseError) {
      // If JSON parsing fails, treat as old format (just user ID)
      // This provides backward compatibility
      return {
        id: sessionCookie,
        email: "user@example.com", // Placeholder
        isAdmin: false, // Default to non-admin for old sessions
        role: 'coworker',
        name: undefined,
        apiKey: undefined,
      };
    }
  } catch (error) {
    console.error("Error handling session:", error);
    return null;
  }
});

// Middleware to protect routes
export const requireAuth = cache(async () => {
  const user = await getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  return user;
});

// Check if user is admin
export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getUser();
  
  if (!user) {
    return false;
  }
  
  // Check if user has admin privileges
  return user.isAdmin === true;
});
