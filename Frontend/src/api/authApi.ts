// // src/api/authApi.ts
// // Connects to your FastAPI /auth endpoints

// const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// export interface SignInPayload {
//   email: string;
//   password: string;
// }
// export interface SignUpPayload {
//   full_name: string;
//   email: string;
//   password: string;
// }
// export interface UserResponse {
//   id: number;
//   full_name: string;
//   email: string;
//   is_active: boolean;
//   created_at: string;
// }

// interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
//   error: string | null;
// }

// async function parseResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
//   const body = await res.json().catch(() => ({})) as Partial<ApiResponse<T>> | { detail?: string }
//   if (!res.ok) {
//     const err = (body as { detail?: string }).detail ?? (body as ApiResponse<T>).error ?? fallbackMessage
//     throw new Error(err)
//   }
//   if ('data' in body) {
//     return body.data as T
//   }
//   return body as T
// }

// export const authApi = {
//   async signUp(payload: SignUpPayload): Promise<UserResponse> {
//     const res = await fetch(`${BASE_URL}/auth/signup`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });
//     return parseResponse<UserResponse>(res, "Sign up failed")
//   },

//   async signIn(payload: SignInPayload): Promise<UserResponse> {
//     const res = await fetch(`${BASE_URL}/auth/login`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });
//     return parseResponse<UserResponse>(res, "Sign in failed")
//   },

//   async googleSignIn(credential: string): Promise<UserResponse> {
//     const endpoints = [`${BASE_URL}/auth/google`, `${BASE_URL}/auth/login/google`, `${BASE_URL}/auth/oauth/google`]
//     let lastError: Error | null = null

//     for (const url of endpoints) {
//       const res = await fetch(url, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ credential }),
//       })

//       if (res.ok) {
//         return parseResponse<UserResponse>(res, "Google sign in failed")
//       }

//       if (res.status === 404) {
//         continue
//       }

//       const errPayload = await res.json().catch(() => ({})) as { detail?: string; error?: string }
//       lastError = new Error(errPayload.detail ?? errPayload.error ?? "Google sign in failed")
//       break
//     }

//     throw lastError ?? new Error("Google sign in endpoint is not available on the backend")
//   },
// };
// src/api/authApi.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface SignInPayload  { email: string; password: string }
export interface SignUpPayload  { full_name: string; email: string; password: string }
export interface UserResponse   { id: number; full_name: string; email: string; is_active: boolean; created_at: string }

interface ApiResponse<T> { success: boolean; message: string; data: T; error: string | null }

async function parseResponse<T>(res: Response, fallback: string): Promise<T> {
  const body = await res.json().catch(() => ({})) as Partial<ApiResponse<T>> & { detail?: string }
  if (!res.ok) throw new Error(body.detail ?? body.error ?? fallback)
  return (body as ApiResponse<T>).data ?? (body as T)
}

export const authApi = {
  async signUp(payload: SignUpPayload): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return parseResponse<UserResponse>(res, "Sign up failed")
  },

  async signIn(payload: SignInPayload): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return parseResponse<UserResponse>(res, "Sign in failed")
  },

  // No /auth/google endpoint on backend — we decode the Google JWT here,
  // then use the existing /auth/login and /auth/signup endpoints.
  async googleSignIn(credential: string): Promise<UserResponse> {
    // Decode Google JWT (public claims — no secret needed to read them)
    const payload = JSON.parse(
      atob(credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    )
    const email: string     = payload.email
    const full_name: string = payload.name ?? email.split('@')[0]
    const password: string  = `google_${payload.sub}` // deterministic, user never types this

    // Step 1: returning Google user — try login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (loginRes.ok) return parseResponse<UserResponse>(loginRes, "Google sign in failed")

    // Step 2: first-time Google user — register them
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, full_name, password }),
    })
    if (!signupRes.ok) {
      const err = await signupRes.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? "Could not sign in with Google. Try signing in with your password.")
    }
    return parseResponse<UserResponse>(signupRes, "Google sign up failed")
  },
}