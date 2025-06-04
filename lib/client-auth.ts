"use client";

import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// Client-side function to set the session cookie
export async function setSessionCookie(userId: string) {
  try {
    // Get user data from Firestore to include role information
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.error("User document not found when setting session cookie");
      
      // Try to get the current user from Firebase Auth
      const { auth } = await import("./firebase");
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.uid === userId) {
        // Create a basic user document as a recovery mechanism
        const { setDoc, doc, Timestamp } = await import("firebase/firestore");
        
        const userData = {
          email: currentUser.email,
          name: currentUser.email?.split('@')[0] || "User",
          createdAt: Timestamp.now(),
          isAdmin: false,
          apiKey: "",
          role: "coworker",
          organizationId: userId, // Default to self-organization
        };
        
        await setDoc(doc(db, 'users', userId), userData);
        console.log("Created missing user document during session setup");
        
        // Create session data with recovered user information
        const sessionData = {
          userId: userId,
          email: currentUser.email,
          role: "coworker",
          isAdmin: false,
          name: currentUser.email?.split('@')[0] || "User"
        };
        
        const sessionCookie = JSON.stringify(sessionData);
        document.cookie = `session=${sessionCookie}; path=/; max-age=${60 * 60 * 24 * 14}; SameSite=Strict`;
        return;
      }
      
      // If we can't recover, fall back to just storing the user ID
      document.cookie = `session=${userId}; path=/; max-age=${60 * 60 * 24 * 14}; SameSite=Strict`;
      return;
    }
    
    const userData = userDoc.data();
    
    // Create session data with user information including role
    const sessionData = {
      userId: userId,
      email: userData.email,
      role: userData.role || 'coworker', // Default to coworker if no role set
      isAdmin: userData.isAdmin || false,
      name: userData.name
    };
    
    // Store the session data as a JSON string
    const sessionCookie = JSON.stringify(sessionData);
    
    document.cookie = `session=${sessionCookie}; path=/; max-age=${60 * 60 * 24 * 14}; SameSite=Strict`;
  } catch (error) {
    console.error("Error setting session cookie:", error);
    // Fallback to just storing the user ID if there's an error
    document.cookie = `session=${userId}; path=/; max-age=${60 * 60 * 24 * 14}; SameSite=Strict`;
  }
}

// Clear session cookie on logout
export function clearSessionCookie() {
  document.cookie = "session=; path=/; max-age=0";
}