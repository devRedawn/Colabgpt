import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK for server-side operations
function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Try to get service account from environment
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccount) {
    try {
      const adminApp = initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      
      return adminApp;
    } catch (error) {
      console.error("Failed to initialize Firebase Admin with service account:", error);
    }
  }

  // Fallback: Initialize with default credentials (for development)
  // This will work if you're running in a Firebase/Google Cloud environment
  // or have GOOGLE_APPLICATION_CREDENTIALS set
  try {
    const adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    
    return adminApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw new Error("Firebase Admin initialization failed. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
  }
}

// Get Firestore instance with admin privileges
export function getAdminFirestore() {
  const app = getFirebaseAdmin();
  return getFirestore(app);
}