import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  fetchSignInMethodsForEmail
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";

export type AuthError = {
  message: string;
};

export async function signUp(
  email: string,
  password: string,
  organizationName?: string
): Promise<UserCredential | AuthError> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Every signup creates their own organization and becomes admin
    console.log("Creating new organization admin");
    
    // Create organization document first
    const orgName = organizationName && organizationName.trim()
      ? organizationName.trim()
      : `${userCredential.user.email?.split('@')[0] || 'User'}'s Organization`;
      
    await setDoc(doc(db, "organizations", userCredential.user.uid), {
      name: orgName,
      adminId: userCredential.user.uid,
      createdAt: Timestamp.now(),
    });
    
    // Create user document - every signup is admin of their own organization
    const userData = {
      email: userCredential.user.email,
      name: userCredential.user.email?.split('@')[0] || "User",
      createdAt: Timestamp.now(),
      isAdmin: true, // Every signup is admin of their own org
      apiKey: "",
      role: "admin", // Every signup gets admin role
      organizationId: userCredential.user.uid, // Their own org
    };
    
    console.log("Creating user with data:", userData);
    await setDoc(doc(db, "users", userCredential.user.uid), userData);
    
    return userCredential;
  } catch (error: any) {
    return { message: error.message };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<UserCredential | AuthError> {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    return { message: error.message };
  }
}

export async function signOutUser(): Promise<void | AuthError> {
  try {
    return await signOut(auth);
  } catch (error: any) {
    return { message: error.message };
  }
}

export async function getCurrentUser() {
  return auth.currentUser;
}

// Function for admin to create coworker accounts
export async function createCoworkerAccount(
  email: string,
  password: string,
  name: string
): Promise<UserCredential | AuthError> {
  try {
    // Get current user (admin) to link coworker to their organization
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Admin must be logged in to create coworker accounts");
    }
    
    console.log("Current admin user:", currentUser.uid);
    
    // First, check if organization exists for this admin
    const orgDoc = await getDoc(doc(db, "organizations", currentUser.uid));
    if (!orgDoc.exists()) {
      console.log("Creating missing organization for admin");
      // Create organization if it doesn't exist
      await setDoc(doc(db, "organizations", currentUser.uid), {
        name: `${currentUser.email?.split('@')[0] || 'Admin'}'s Organization`,
        adminId: currentUser.uid,
        createdAt: Timestamp.now(),
      });
    }
    
    // Get admin's organization ID
    const adminDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!adminDoc.exists()) {
      console.error("Admin document not found in Firestore for UID:", currentUser.uid);
      
      // Create admin document if it doesn't exist (recovery mechanism)
      await setDoc(doc(db, "users", currentUser.uid), {
        email: currentUser.email,
        name: currentUser.email?.split('@')[0] || "Admin",
        createdAt: Timestamp.now(),
        isAdmin: true,
        apiKey: "",
        role: "admin",
        organizationId: currentUser.uid,
      });
      
      console.log("Created missing admin document");
    }
    
    const adminData = adminDoc.exists() ? adminDoc.data() : { organizationId: currentUser.uid };
    const organizationId = adminData.organizationId || currentUser.uid;
    
    console.log("Using organization ID:", organizationId);
    
    // Create the coworker account in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    console.log("Created coworker auth account:", userCredential.user.uid);
    
    // Create user document in Firestore
    const userData = {
      email: userCredential.user.email,
      name: name,
      createdAt: Timestamp.now(),
      isAdmin: false, // Coworkers are not admins
      apiKey: "", // Will be set by admin later
      organizationId: organizationId, // Link to admin's organization
      role: "coworker", // Mark as coworker
      invitedBy: currentUser.uid, // Track who invited them
    };
    
    console.log("Creating coworker document with data:", userData);
    await setDoc(doc(db, "users", userCredential.user.uid), userData);
    
    // Sign back in as the admin user since Firebase Auth switched to the new user
    await signInWithEmailAndPassword(auth, currentUser.email!, password);
    
    return userCredential;
  } catch (error: any) {
    console.error("Error creating coworker account:", error);
    return { message: error.message };
  }
}

// Utility function to check existing users and admin status
export async function debugUserDatabase(): Promise<void> {
  try {
    const { collection, getDocs, query, where, getDoc, doc } = await import("firebase/firestore");
    
    console.log("=== USER DATABASE DEBUG ===");
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, "users"));
    console.log("Total users:", usersSnapshot.size);
    
    // Track organization IDs to check later
    const organizationIds = new Set<string>();
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`User ID: ${doc.id}`);
      console.log(`Email: ${userData.email}`);
      console.log(`Name: ${userData.name || 'Not set'}`);
      console.log(`Role: ${userData.role || 'Not set'}`);
      console.log(`IsAdmin: ${userData.isAdmin}`);
      console.log(`Organization ID: ${userData.organizationId || 'Not set'}`);
      console.log(`Created At: ${userData.createdAt?.toDate?.() || 'Not set'}`);
      console.log(`Invited By: ${userData.invitedBy || 'Not set'}`);
      console.log("---");
      
      // Add organization ID to check
      if (userData.organizationId) {
        organizationIds.add(userData.organizationId);
      }
    });
    
    // Check for admin users specifically
    const adminQuery = query(collection(db, "users"), where("role", "==", "admin"));
    const adminSnapshot = await getDocs(adminQuery);
    console.log("Admin users found:", adminSnapshot.size);
    
    // Check organizations
    console.log("\n=== ORGANIZATIONS DEBUG ===");
    const orgsSnapshot = await getDocs(collection(db, "organizations"));
    console.log("Total organizations:", orgsSnapshot.size);
    
    orgsSnapshot.forEach((doc) => {
      const orgData = doc.data();
      console.log(`Organization ID: ${doc.id}`);
      console.log(`Name: ${orgData.name || 'Not set'}`);
      console.log(`Admin ID: ${orgData.adminId || 'Not set'}`);
      console.log(`Created At: ${orgData.createdAt?.toDate?.() || 'Not set'}`);
      console.log("---");
      
      // Remove from our tracking set since we found it
      organizationIds.delete(doc.id);
    });
    
    // Check for missing organizations referenced by users
    if (organizationIds.size > 0) {
      console.log("\n=== MISSING ORGANIZATIONS ===");
      console.log(`Found ${organizationIds.size} organization IDs referenced by users but not existing in the organizations collection`);
      
      for (const orgId of Array.from(organizationIds)) {
        console.log(`Missing organization: ${orgId}`);
        
        // Try to find the admin for this organization
        const adminQuery = query(collection(db, "users"),
          where("organizationId", "==", orgId),
          where("isAdmin", "==", true));
        
        const adminSnapshot = await getDocs(adminQuery);
        if (adminSnapshot.size > 0) {
          console.log(`Found ${adminSnapshot.size} admin(s) for this missing organization`);
        } else {
          console.log("No admins found for this organization");
        }
      }
    }
    
    // Check current user
    console.log("\n=== CURRENT USER DEBUG ===");
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log(`Current User ID: ${currentUser.uid}`);
      console.log(`Current User Email: ${currentUser.email}`);
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        console.log("User document exists in Firestore");
        const userData = userDoc.data();
        console.log(`Role: ${userData.role || 'Not set'}`);
        console.log(`IsAdmin: ${userData.isAdmin}`);
      } else {
        console.log("WARNING: User document does not exist in Firestore!");
      }
      
      // Check if organization exists
      const orgDoc = await getDoc(doc(db, "organizations", currentUser.uid));
      if (orgDoc.exists()) {
        console.log("Organization document exists");
      } else {
        console.log("WARNING: Organization document does not exist!");
      }
    } else {
      console.log("No user currently logged in");
    }
    
    console.log("\n=== END DEBUG ===");
  } catch (error) {
    console.error("Error debugging user database:", error);
  }
}

// Utility function to promote a user to admin (use carefully!)
export async function promoteUserToAdmin(userId: string): Promise<boolean> {
  try {
    const { updateDoc } = await import("firebase/firestore");
    
    await updateDoc(doc(db, "users", userId), {
      role: "admin",
      isAdmin: true
    });
    
    console.log(`User ${userId} promoted to admin`);
    return true;
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    return false;
  }
}

// Helper function to check if this is the first user signing up
async function isFirstUserSignUp(): Promise<boolean> {
  try {
    // Check if any users exist in the database at all
    const { collection, getDocs, limit, query } = await import("firebase/firestore");
    
    // Query for any users (limit to 1 for efficiency)
    const usersQuery = query(collection(db, "users"), limit(1));
    const usersSnapshot = await getDocs(usersQuery);
    
    console.log("Users collection empty:", usersSnapshot.empty);
    console.log("Number of existing users:", usersSnapshot.size);
    
    // If no users exist at all, this is the first user
    const isFirst = usersSnapshot.empty;
    console.log("Returning isFirstUser:", isFirst);
    return isFirst;
  } catch (error) {
    console.error("Error checking if first user:", error);
    // If we can't determine, default to making the user an admin
    // This is safer for initial setup
    console.log("Error occurred, defaulting to admin: true");
    return true;
  }
}