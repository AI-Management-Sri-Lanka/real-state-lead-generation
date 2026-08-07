// src/api/authApi.ts
// Connects to your FastAPI /auth endpoints

import { BASE_URL } from './config';

export interface SignInPayload {
  email: string;
  password: string;
}
export interface SignUpPayload {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
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

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = localStorage.getItem("aimsl_token");
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  let res = await fetch(url, { ...options, headers });
  
  // Handle 401 Unauthorized by attempting to refresh the token
  if (res.status === 401) {
    const refreshToken = localStorage.getItem("aimsl_refresh_token");
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (refreshRes.ok) {
        const resData = await refreshRes.json() as ApiResponse<TokenResponse>;
        token = resData.data.access_token;
        localStorage.setItem("aimsl_token", token);
        localStorage.setItem("aimsl_refresh_token", resData.data.refresh_token);
        
        // Retry original request with new token
        headers.set("Authorization", `Bearer ${token}`);
        res = await fetch(url, { ...options, headers });
      } else {
        // Refresh failed (token expired or revoked), clear session
        localStorage.removeItem("aimsl_token");
        localStorage.removeItem("aimsl_refresh_token");
        localStorage.removeItem("aimsl_user");
        window.location.href = "/auth/signin";
      }
    }
  }
  return res;
}

export const authApi = {
  async signUp(payload: SignUpPayload): Promise<{ user: UserResponse, tokens: TokenResponse }> {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errorMessage = err.error?.message || err.detail || err.message || "Sign up failed";
      throw new Error(errorMessage);
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
      const err = await res.json().catch(() => ({}));
      const errorMessage = err.error?.message || err.detail || err.message || "Sign in failed";
      throw new Error(errorMessage);
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
  
  async getMe(token?: string): Promise<UserResponse> {
    // We can use fetchWithAuth which handles the token automatically
    const res = await fetchWithAuth(`${BASE_URL}/auth/me`, { method: "GET" });
    if (!res.ok) throw new Error("Failed to fetch user");
    const resData = await res.json() as ApiResponse<UserResponse>;
    return resData.data;
  },

  async updateProfile(payload: { full_name?: string; email?: string }): Promise<UserResponse> {
    const res = await fetchWithAuth(`${BASE_URL}/auth/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.detail || err.message || "Failed to update profile");
    }
    const resData = await res.json() as ApiResponse<UserResponse>;
    return resData.data;
  },

  async changePassword(payload: { current_password: string; new_password: string }): Promise<void> {
    const res = await fetchWithAuth(`${BASE_URL}/auth/change-password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.detail || err.message || "Failed to change password");
    }
  },

  async deleteAccount(): Promise<void> {
    const res = await fetchWithAuth(`${BASE_URL}/auth/me`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.detail || err.message || "Failed to delete account");
    }
  }
};
