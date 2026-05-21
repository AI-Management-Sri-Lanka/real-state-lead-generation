// src/api/authApi.ts
// Connects to your FastAPI /auth endpoints (JWT-based)

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface SignInPayload { email: string; password: string }
export interface SignUpPayload { name: string; email: string; password: string }
export interface AuthResponse  { access_token: string; user: { id: string; name: string; email: string } }

export const authApi = {
  async signIn(payload: SignInPayload): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? 'Sign in failed')
    }
    return res.json() as Promise<AuthResponse>
  },

  async signUp(payload: SignUpPayload): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? 'Sign up failed')
    }
    return res.json() as Promise<AuthResponse>
  },
}
