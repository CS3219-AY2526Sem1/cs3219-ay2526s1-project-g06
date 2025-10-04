import { createContext, useContext, useEffect, useState } from "react";
import { me, logout } from "../api/auth";

type User = { sub: string; email: string } | null;

const Ctx = createContext<{
  user: User;
  loading: boolean;
  setUser: (u: User) => void;
  signOut: () => Promise<void>;
}>({ user: null, loading: true, setUser: () => {}, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await me();
      setUser(res?.user ?? null);
      setLoading(false);
    })();
  }, []);

  async function signOut() {
    await logout();
    setUser(null);
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