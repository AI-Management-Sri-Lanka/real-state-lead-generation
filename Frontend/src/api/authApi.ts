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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authApi = {
  async signUp(payload: SignUpPayload): Promise<{ user: UserResponse, tokens: TokenResponse }> {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { detail?: string };
      throw new Error(err.detail ?? "Sign up failed");
    }
    const resData = await res.json() as ApiResponse<TokenResponse>;
    const tokens = resData.data;
    
    // Fetch user info with the new token
    const userRes = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) throw new Error("Failed to fetch user after sign up");
    const userData = await userRes.json() as ApiResponse<UserResponse>;
    
    return { user: userData.data, tokens };
  },

  async signIn(payload: SignInPayload): Promise<{ user: UserResponse, tokens: TokenResponse }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { detail?: string };
      throw new Error(err.detail ?? "Sign in failed");
    }
    const resData = await res.json() as ApiResponse<TokenResponse>;
    const tokens = resData.data;
    
    // Fetch user info with the new token
    const userRes = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) throw new Error("Failed to fetch user after sign in");
    const userData = await userRes.json() as ApiResponse<UserResponse>;
    
    return { user: userData.data, tokens };
  },
  
  async getMe(token: string): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    const resData = await res.json() as ApiResponse<UserResponse>;
    return resData.data;
  }
};
