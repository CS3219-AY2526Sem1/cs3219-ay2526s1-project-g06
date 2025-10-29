import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "../lib/firebase";
import { createSession, me } from "../api/auth";

interface User {
  sub: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  language?: string;
  profileCompleted?: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const userData = await me();
      if (userData) {
        // Prefer Firebase photoURL if available (fresher from Google)
        const photoURL = firebaseUser?.photoURL || userData.photoURL;
        console.log('🔄 AuthContext: Refreshed user data:', { 
          email: userData.email, 
          photoURL: photoURL ? 'Present' : 'Missing' 
        });
        setUser({ ...userData, photoURL });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    console.log("AuthContext: Checking existing session...");
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("AuthContext: Firebase auth state changed:", firebaseUser?.email);
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          console.log("AuthContext: Firebase user detected, getting token...");
          const idToken = await firebaseUser.getIdToken();
          
          console.log("AuthContext: Creating backend session...");
          const sessionResponse = await createSession(idToken);
          
          console.log("AuthContext: Session response:", {
            email: sessionResponse.user.email,
            displayName: sessionResponse.user.displayName,
            photoURL: sessionResponse.user.photoURL ? 'Present' : 'Missing'
          });

          // Use the user data from createSession response
          // This includes the photoURL that was just created
          const userData = {
            sub: sessionResponse.user.sub,
            email: sessionResponse.user.email,
            displayName: sessionResponse.user.displayName,
            photoURL: firebaseUser.photoURL || sessionResponse.user.photoURL, // Prefer Firebase
            bio: sessionResponse.user.bio,
            language: sessionResponse.user.language,
            profileCompleted: sessionResponse.user.profileCompleted,
            role: sessionResponse.user.role
          };

          console.log("AuthContext: Setting user data:", {
            email: userData.email,
            displayName: userData.displayName,
            photoURL: userData.photoURL ? 'Set' : 'Missing'
          });

          setUser(userData);
        } catch (error) {
          console.error("AuthContext: Failed to create backend session:", error);
          setUser(null);
        }
      } else {
        console.log("AuthContext: No Firebase user");
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
      console.log("AuthContext: User signed out");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}