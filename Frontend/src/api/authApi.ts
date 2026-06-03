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
export interface UpdateProfilePayload {
  full_name: string;
  email: string;
  password?: string;
}
export interface UserResponse {
  id: number | string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

async function parseError(res: Response) {
  const payload = await res.json().catch(() => ({} as { detail?: string }))
  return payload.detail ?? res.statusText ?? 'Request failed'
}

export const authApi = {
  async signUp(payload: SignUpPayload): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await parseError(res));
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
      throw new Error(await parseError(res));
    }
    return res.json() as Promise<UserResponse>;
  },

  async getProfile(): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(await parseError(res));
    }
    return res.json() as Promise<UserResponse>;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await parseError(res));
    }
    return res.json() as Promise<UserResponse>;
  },
};
