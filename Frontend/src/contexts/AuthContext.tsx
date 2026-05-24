// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, useCallback } from 'react'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null)
  const [isLoading, setLoading] = useState(true)

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
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    // TODO: replace with real API call — api.auth.signIn(email, password)
    await new Promise(r => setTimeout(r, 800)) // simulate network
    if (password.length < 6) throw new Error('Invalid credentials')
    const u: User = { id: '1', name: email.split('@')[0], email }
    setUser(u)
    localStorage.setItem('aimsl_user', JSON.stringify(u))
  }, [])

  const signUp = useCallback(async (name: string, email: string, _password: string) => {
    // TODO: replace with real API call — api.auth.signUp(name, email, password)
    await new Promise(r => setTimeout(r, 800))
    const u: User = { id: Date.now().toString(), name, email }
    setUser(u)
    localStorage.setItem('aimsl_user', JSON.stringify(u))
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    localStorage.removeItem('aimsl_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
