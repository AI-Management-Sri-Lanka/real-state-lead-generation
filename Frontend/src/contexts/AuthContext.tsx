// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, useCallback } from "react";
import { authApi, UpdateProfilePayload } from "@/api/authApi";

export interface User {
  id: number | string;
  name: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

function normalizeName(value: any): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (full_name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  error: string | null;
}

function normalizeUser(raw: any): User {
  const normalizedName =
    normalizeName(raw.full_name) ??
    normalizeName(raw.name) ??
    normalizeName(raw.username) ??
    normalizeName(raw.email?.split?.('@')?.[0]) ??
    'User'

  return {
    id: raw.id,
    full_name: normalizedName,
    name: normalizedName,
    email: raw.email ?? '',
    is_active: raw.is_active ?? true,
    created_at: raw.created_at ?? new Date().toISOString(),
  }
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
        try {
          setUser(normalizeUser(JSON.parse(devUser)))
        } catch {
          /* ignore */
        }
      } else {
        const u = normalizeUser({ id: 'dev', name: 'Developer', email: 'dev@example.com', is_active: true, created_at: new Date().toISOString() })
        setUser(u)
        localStorage.setItem('aimsl_user', JSON.stringify(u))
      }
      setLoading(false)
      return
    }

    const stored = localStorage.getItem('aimsl_user')

    if (stored) {
      try {
        setUser(normalizeUser(JSON.parse(stored)))
      } catch {
        /* ignore */
      }
    }

    setLoading(false)

    if (stored) {
      authApi.getProfile()
        .then(profile => {
          const normalized = normalizeUser(profile)
          setUser(normalized)
          localStorage.setItem('aimsl_user', JSON.stringify(normalized))
        })
        .catch(() => {
          // keep cached user state if refresh fails
        })
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authApi.signIn({ email, password });
      const normalized = normalizeUser(userData);
      setUser(normalized);
      localStorage.setItem("aimsl_user", JSON.stringify(normalized));
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
        const normalized = normalizeUser(userData);
        setUser(normalized);
        localStorage.setItem("aimsl_user", JSON.stringify(normalized));
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

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await authApi.updateProfile(payload);
      const normalized = normalizeUser(updated);
      setUser(normalized);
      localStorage.setItem("aimsl_user", JSON.stringify(normalized));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Profile update failed";
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
        updateProfile,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
