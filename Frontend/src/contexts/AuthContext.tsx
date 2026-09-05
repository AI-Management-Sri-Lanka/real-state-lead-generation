// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, useCallback } from "react";
import { authApi } from "@/api/authApi";

export interface User {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  auth_provider?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (full_name: string, email: string, password: string, confirm_password: string) => Promise<void>;
  googleSignIn: (idToken: string) => Promise<void>;
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
    const storedUser = localStorage.getItem('aimsl_user')
    const storedToken = localStorage.getItem('aimsl_token')

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        // Verify token in background so we redirect out if refresh token expired
        authApi.getMe().catch(() => {
          setUser(null);
          localStorage.removeItem('aimsl_user');
          localStorage.removeItem('aimsl_token');
          localStorage.removeItem('aimsl_refresh_token');
        });
      } catch {
        setUser(null);
      }
    } else {
      // Clear potentially mismatched state
      localStorage.removeItem('aimsl_user');
      localStorage.removeItem('aimsl_token');
      localStorage.removeItem('aimsl_refresh_token');
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user: userData, tokens } = await authApi.signIn({ email, password });
      setUser(userData);
      localStorage.setItem("aimsl_user", JSON.stringify(userData));
      localStorage.setItem("aimsl_token", tokens.access_token);
      localStorage.setItem("aimsl_refresh_token", tokens.refresh_token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (full_name: string, email: string, password: string, confirm_password: string) => {
      setLoading(true);
      setError(null);
      try {
        const { user: userData, tokens } = await authApi.signUp({ full_name, email, password, confirm_password });
        setUser(userData);
        localStorage.setItem("aimsl_user", JSON.stringify(userData));
        localStorage.setItem("aimsl_token", tokens.access_token);
        localStorage.setItem("aimsl_refresh_token", tokens.refresh_token);
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

  const googleSignIn = useCallback(async (idToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user: userData, tokens } = await authApi.googleAuth({ id_token: idToken });
      setUser(userData);
      localStorage.setItem("aimsl_user", JSON.stringify(userData));
      localStorage.setItem("aimsl_token", tokens.access_token);
      localStorage.setItem("aimsl_refresh_token", tokens.refresh_token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem("aimsl_user");
    localStorage.removeItem("aimsl_token");
    localStorage.removeItem("aimsl_refresh_token");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        googleSignIn,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}