"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/components/firebase-auth-provider";

type Coworker = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export default function CoworkerList() {
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCoworkers = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get the current user's document to find their organizationId
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          setError("User document not found");
          setLoading(false);
          return;
        }
        
        const userData = userDocSnap.data();
        const organizationId = userData.organizationId;
        
        if (!organizationId) {
          setError("Organization ID not found");
          setLoading(false);
          return;
        }
        
        // Query all users with the same organizationId who are not admins
        const coworkersQuery = query(
          collection(db, "users"),
          where("organizationId", "==", organizationId),
          where("role", "==", "coworker")
        );
        
        const coworkersSnapshot = await getDocs(coworkersQuery);
        
        const coworkersList: Coworker[] = [];
        coworkersSnapshot.forEach((doc) => {
          const data = doc.data();
          coworkersList.push({
            id: doc.id,
            name: data.name || "Unknown",
            email: data.email || "No email",
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
        
        // Sort by creation date (newest first)
        coworkersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setCoworkers(coworkersList);
      } catch (err) {
        console.error("Error fetching coworkers:", err);
        setError("Failed to load coworkers");
      } finally {
        setLoading(false);
      }
    };

    fetchCoworkers();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 border rounded-lg">
        <p className="text-center">Loading coworkers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Your Coworkers</h3>
      
      {coworkers.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          You haven't invited any coworkers yet.
        </p>
      ) : (
        <div className="space-y-4">
          {coworkers.map((coworker) => (
            <div 
              key={coworker.id} 
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{coworker.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{coworker.email}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Joined {coworker.createdAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}