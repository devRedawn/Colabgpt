"use server";

import { getUser } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

/**
 * Simple test function to save credentials without encryption
 */
export async function testSaveCredentials(
  azureApiKey: string,
  azureEndpoint: string
): Promise<{ success: boolean; error?: string; debug?: any }> {
  try {
    console.log("=== TEST SAVE CREDENTIALS START ===");
    
    const user = await getUser();
    console.log("User:", user ? user.id : "null");
    
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if user is admin
    const userDoc = await getDoc(doc(db, "users", user.id));
    console.log("User doc exists:", userDoc.exists());
    
    if (!userDoc.exists()) {
      return { success: false, error: "User document not found" };
    }

    const userData = userDoc.data();
    console.log("User data:", userData);
    
    if (!userData.isAdmin) {
      return { success: false, error: "Only administrators can save credentials" };
    }

    const organizationId = userData.organizationId;
    console.log("Organization ID:", organizationId);
    
    if (!organizationId) {
      return { success: false, error: "No organization found" };
    }

    // Check if organization document exists
    const orgDoc = await getDoc(doc(db, "organizations", organizationId));
    console.log("Organization doc exists:", orgDoc.exists());
    
    if (!orgDoc.exists()) {
      console.log("Creating organization document...");
      // Create the organization document first
      const orgData = {
        name: `${userData.email?.split('@')[0] || 'User'}'s Organization`,
        adminId: user.id,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      
      await setDoc(doc(db, "organizations", organizationId), orgData);
      console.log("Organization document created");
    } else {
      console.log("Organization document exists, data:", orgDoc.data());
    }

    // Try to save simple test data
    const testData = {
      testAzureApiKey: azureApiKey,
      testAzureEndpoint: azureEndpoint,
      lastTestUpdate: new Date()
    };
    
    console.log("Attempting to save test data:", testData);
    await updateDoc(doc(db, "organizations", organizationId), testData);
    
    console.log("Test data saved successfully!");
    return { 
      success: true, 
      debug: {
        userId: user.id,
        organizationId,
        userData
      }
    };
  } catch (error: any) {
    console.error("Error in testSaveCredentials:", error);
    return { 
      success: false, 
      error: `Test save failed: ${error.message}`,
      debug: { errorStack: error.stack }
    };
  }
}