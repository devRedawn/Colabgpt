"use client";

import { auth } from "@/lib/firebase";
import { User, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function FirebaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isMounted) return;
      
      // Only update state if there's an actual change
      setUser(prevUser => {
        if (prevUser?.uid !== firebaseUser?.uid) {
          return firebaseUser;
        }
        return prevUser;
      });
      
      setLoading(false);
      
      // Handle session sync in the background without blocking state updates
      if (firebaseUser) {
        firebaseUser.getIdToken().then(idToken => {
          fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idToken,
              userId: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName
            }),
          }).catch(error => console.error('Session sync error:', error));
        }).catch(error => console.error('Token error:', error));
      } else {
        fetch('/api/auth/signout', { method: 'POST' })
          .catch(error => console.error('Signout error:', error));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
