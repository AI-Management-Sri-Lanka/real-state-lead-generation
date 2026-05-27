// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, useCallback } from "react";
import { authApi } from "@/api/authApi";

export interface User {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (full_name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  error: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    // Development helper: auto-sign-in when running locally
    // This makes it faster to test protected routes during development only.
    // It will not run in production builds.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (import.meta?.env?.DEV) {
      const devUser = localStorage.getItem('aimsl_user')
      if (devUser) {
        try { setUser(JSON.parse(devUser)) } catch { /* ignore */ }
      } else {
        const u: User = { id: 'dev', name: 'Developer', email: 'dev@example.com' }
        setUser(u)
        localStorage.setItem('aimsl_user', JSON.stringify(u))
      }
      setLoading(false)
      return
    }

    const stored = localStorage.getItem('aimsl_user')

    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authApi.signIn({ email, password });
      setUser(userData);
      localStorage.setItem("aimsl_user", JSON.stringify(userData));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (full_name: string, email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const userData = await authApi.signUp({ full_name, email, password });
        setUser(userData);
        localStorage.setItem("aimsl_user", JSON.stringify(userData));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign up failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem("aimsl_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
