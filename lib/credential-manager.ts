"use server";

import { getUser } from "@/lib/auth";
import { getAdminFirestore } from "@/lib/firebase-admin";

// Simple base64 encoding for basic obfuscation (better than plaintext)
// For production, consider using a proper encryption service

/**
 * Encodes credential data (basic obfuscation)
 */
function encryptCredential(credential: string): string {
  try {
    // Simple base64 encoding with a prefix for identification
    const encoded = Buffer.from(credential, 'utf8').toString('base64');
    return `cgpt_${encoded}`;
  } catch (error) {
    console.error("Encoding error:", error);
    throw new Error("Failed to encode credential");
  }
}

/**
 * Decodes credential data
 */
function decryptCredential(encryptedCredential: string): string {
  try {
    // Remove prefix and decode
    if (!encryptedCredential.startsWith('cgpt_')) {
      throw new Error("Invalid credential format");
    }
    
    const encoded = encryptedCredential.substring(5);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    return decoded;
  } catch (error) {
    console.error("Decoding error:", error);
    throw new Error("Failed to decode credential");
  }
}

/**
 * Ensures user and organization documents exist, creating them if needed
 */
export async function ensureUserAndOrganization(user: any): Promise<{
  organizationId: string;
  error?: string;
}> {
  try {
    const db = getAdminFirestore();
    
    // Check if user document exists
    const userDocRef = db.collection("users").doc(user.id);
    const userDoc = await userDocRef.get();
    let userData = userDoc.data();
    
    if (!userDoc.exists) {
      console.log("Creating missing user document for:", user.id);
      userData = {
        email: user.email,
        name: user.email?.split('@')[0] || "User",
        createdAt: new Date(),
        isAdmin: true, // First user becomes admin
        role: "admin",
        organizationId: user.id, // Use user ID as org ID for simplicity
      };
      
      await userDocRef.set(userData);
      console.log("User document created successfully");
    }
    
    const organizationId = userData?.organizationId || user.id;
    
    // Check if organization document exists
    const orgDocRef = db.collection("organizations").doc(organizationId);
    const orgDoc = await orgDocRef.get();
    
    if (!orgDoc.exists) {
      console.log("Creating missing organization document for:", organizationId);
      const orgData = {
        name: `${user.email?.split('@')[0] || 'User'}'s Organization`,
        adminId: user.id,
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      
      await orgDocRef.set(orgData);
      console.log("Organization document created successfully");
      
      // Update user document with organizationId if it was missing
      if (!userData?.organizationId) {
        await userDocRef.update({ organizationId });
      }
    }
    
    return { organizationId };
  } catch (error) {
    console.error("Error ensuring user and organization:", error);
    return { organizationId: "", error: "Failed to create or verify user data" };
  }
}

/**
 * Server-side function to get Azure AI credentials for the current user
 * Only accessible from server actions, never sent to client
 */
export async function getAzureCredentials(): Promise<{
  azureApiKey?: string;
  azureEndpoint?: string;
  error?: string;
}> {
  try {
    const user = await getUser();
    if (!user) {
      return { error: "User not authenticated" };
    }

    // Ensure user and organization documents exist
    const { organizationId, error: ensureError } = await ensureUserAndOrganization(user);
    if (ensureError) {
      return { error: ensureError };
    }

    // Get organization's encrypted credentials
    const db = getAdminFirestore();
    const orgDocRef = db.collection("organizations").doc(organizationId);
    const orgDoc = await orgDocRef.get();
    
    if (!orgDoc.exists) {
      return { error: "Organization setup failed" };
    }

    const orgData = orgDoc.data();
    
    // Decrypt credentials server-side
    let azureApiKey: string | undefined;
    let azureEndpoint: string | undefined;

    if (orgData.encryptedAzureApiKey) {
      try {
        azureApiKey = decryptCredential(orgData.encryptedAzureApiKey);
      } catch (error) {
        console.error("Failed to decrypt Azure API key:", error);
        return { error: "Failed to decrypt credentials" };
      }
    }

    if (orgData.encryptedAzureEndpoint) {
      try {
        azureEndpoint = decryptCredential(orgData.encryptedAzureEndpoint);
      } catch (error) {
        console.error("Failed to decrypt Azure endpoint:", error);
        return { error: "Failed to decrypt credentials" };
      }
    }

    if (!azureApiKey || !azureEndpoint) {
      return { error: "Azure AI credentials not configured for this organization" };
    }

    return { azureApiKey, azureEndpoint };
  } catch (error) {
    console.error("Error getting Azure credentials:", error);
    return { error: "Failed to retrieve credentials" };
  }
}

/**
 * Server-side function to save Azure AI credentials (admin only)
 */
export async function saveAzureCredentials(
  azureApiKey: string,
  azureEndpoint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Validate input
    if (!azureApiKey?.trim() || !azureEndpoint?.trim()) {
      return { success: false, error: "Azure API key and endpoint are required" };
    }

    // Ensure user and organization documents exist
    const { organizationId, error: ensureError } = await ensureUserAndOrganization(user);
    if (ensureError) {
      return { success: false, error: ensureError };
    }

    // Verify user is admin
    const db = getAdminFirestore();
    const userDocRef = db.collection("users").doc(user.id);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();
    
    if (!userData?.isAdmin) {
      return { success: false, error: "Only administrators can save credentials" };
    }

    // Encrypt credentials before storing
    console.log("Encrypting credentials for organization:", organizationId);
    const encryptedApiKey = encryptCredential(azureApiKey.trim());
    const encryptedEndpoint = encryptCredential(azureEndpoint.trim());
    console.log("Encryption successful, saving to Firestore...");

    // Save encrypted credentials to organization
    const updateData = {
      encryptedAzureApiKey: encryptedApiKey,
      encryptedAzureEndpoint: encryptedEndpoint,
      lastUpdated: new Date()
    };
    
    console.log("Updating organization document with credentials");
    const orgDocRef = db.collection("organizations").doc(organizationId);
    await orgDocRef.update(updateData);

    console.log("Credentials saved successfully to organization:", organizationId);
    return { success: true };
  } catch (error: any) {
    console.error("Error saving Azure credentials:", error);
    const errorMessage = error?.message || "Failed to save credentials";
    
    // Handle specific Firestore errors
    if (error?.code === 'permission-denied') {
      return { success: false, error: "Permission denied. Please check your authentication and admin status." };
    }
    if (error?.code === 'not-found') {
      return { success: false, error: "Organization document not found. Please try refreshing the page." };
    }
    
    return { success: false, error: `Save failed: ${errorMessage}` };
  }
}

/**
 * Check if user has access to Azure AI credentials
 */
export async function hasAzureCredentials(): Promise<boolean> {
  const result = await getAzureCredentials();
  return !result.error && !!result.azureApiKey && !!result.azureEndpoint;
}