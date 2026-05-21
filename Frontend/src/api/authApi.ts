// src/api/authApi.ts
// Connects to your FastAPI /auth endpoints

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface SignInPayload {
  email: string;
  password: string;
}
export interface SignUpPayload {
  full_name: string;
  email: string;
  password: string;
}
export interface UserResponse {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export const authApi = {
  async signUp(payload: SignUpPayload): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { detail?: string };
      throw new Error(err.detail ?? "Sign up failed");
    }
    return res.json() as Promise<UserResponse>;
  },

  async signIn(payload: SignInPayload): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { detail?: string };
      throw new Error(err.detail ?? "Sign in failed");
    }
    return res.json() as Promise<UserResponse>;
  },
};
