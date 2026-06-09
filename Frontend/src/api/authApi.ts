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

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface BackendResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: any;
}

export const authApi = {
  async signUp(payload: SignUpPayload): Promise<TokenResponse> {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { detail?: string };
      throw new Error(err.detail ?? "Sign up failed");
    }
    const responseData = await res.json() as BackendResponse<TokenResponse>;
    return responseData.data;
  },

  async signIn(payload: SignInPayload): Promise<TokenResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { detail?: string };
      throw new Error(err.detail ?? "Sign in failed");
    }
    const responseData = await res.json() as BackendResponse<TokenResponse>;
    return responseData.data;
  },

  async getMe(token: string): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { detail?: string };
      throw new Error(err.detail ?? "Failed to fetch user data");
    }
    const responseData = await res.json() as BackendResponse<UserResponse>;
    return responseData.data;
  }
};
