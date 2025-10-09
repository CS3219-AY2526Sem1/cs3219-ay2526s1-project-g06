import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { me, logout, createSession } from "../api/auth";

type UserData = { sub: string; email: string } | null;

const Ctx = createContext<{
  user: UserData;
  loading: boolean;
  setUser: (u: UserData) => void;
  signOut: () => Promise<void>;
}>({ user: null, loading: true, setUser: () => {}, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    (async () => {
      console.log('AuthContext: Checking existing session...');
      try {
        const res = await me();
        console.log('AuthContext: me() returned:', res);
        if (res?.user) {
          setUser({ sub: res.user.sub, email: res.user.email });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: No existing session');
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser && !user) {
        console.log('Firebase user detected, creating backend session...');
        try {
          // Get Firebase token and create backend session
          const token = await firebaseUser.getIdToken();
          const response = await createSession(token);
          setUser(response.user);
          console.log('Backend session created successfully');
        } catch (error) {
          console.error('Failed to create backend session:', error);
          setUser(null);
        }
      } else if (!firebaseUser && user) {
        // Firebase user signed out, clear our user state
        console.log('Firebase user signed out');
        setUser(null);
      }
    });

    return unsubscribe;
  }, []); // Remove user dependency to prevent infinite loops

  async function signOut() {
    try {
      console.log('Signing out...');
      await logout(); // Clear backend session
      await auth.signOut(); // Sign out from Firebase
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  return (
    <Ctx.Provider value={{ user, loading, setUser, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}