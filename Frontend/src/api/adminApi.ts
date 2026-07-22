// src/api/adminApi.ts
// ─────────────────────────────────────────────────────────────────────────────
// Dedicated API client for the Master Admin portal.
// Reads aimsl_admin_token from localStorage and injects it as Authorization header.
// ─────────────────────────────────────────────────────────────────────────────
import { BASE_URL } from './config'

function adminHeaders(): HeadersInit {
  const token = localStorage.getItem('aimsl_admin_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: { ...adminHeaders(), ...options.headers },
  })
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('aimsl_admin_token')
    localStorage.removeItem('aimsl_admin')
    window.location.href = '/admin/login'
  }
  return res
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error?.message ?? body?.message ?? 'Request failed')
  return (body?.data ?? body) as T
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_users: number
  active_users: number
  inactive_users: number
  new_users_last_7_days: number
  total_properties: number
  verified_properties: number
  unverified_properties: number
  properties_by_type: Record<string, number>
  total_chat_sessions: number
}

export interface AdminUser {
  id: number
  full_name: string
  email: string
  is_active: boolean
  created_at: string
}

export interface AdminRecord {
  id: number
  full_name: string
  email: string
  is_active: boolean
}

export interface AdminSession {
  id: string
  user_id: number
  title: string
  message_count: number
  created_at: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const adminDashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const res = await adminFetch(`${BASE_URL}/admin/dashboard/stats`)
    return unwrap<DashboardStats>(res)
  },
}

// ─── User Management ──────────────────────────────────────────────────────────
export const adminUsersApi = {
  async getUsers(params?: { skip?: number; limit?: number }): Promise<{ users: AdminUser[]; total: number }> {
    const url = new URL(`${BASE_URL}/admin/manage/users`)
    if (params?.skip != null) url.searchParams.set('skip', String(params.skip))
    if (params?.limit != null) url.searchParams.set('limit', String(params.limit))
    const res = await adminFetch(url.toString())
    return unwrap<{ users: AdminUser[]; total: number }>(res)
  },

  async toggleUserStatus(userId: number, isActive: boolean): Promise<AdminUser> {
    const res = await adminFetch(
      `${BASE_URL}/admin/manage/users/${userId}/toggle-status?is_active=${isActive}`,
      { method: 'POST' }
    )
    return unwrap<AdminUser>(res)
  },

  async deleteUser(userId: number): Promise<void> {
    await adminFetch(`${BASE_URL}/admin/manage/users/${userId}`, { method: 'DELETE' })
  },
}

// ─── Admin Management ─────────────────────────────────────────────────────────
export const adminMgmtApi = {
  async getAdmins(): Promise<{ admins: AdminRecord[]; total: number }> {
    const res = await adminFetch(`${BASE_URL}/admin/manage/admins`)
    return unwrap<{ admins: AdminRecord[]; total: number }>(res)
  },

  async toggleAdminStatus(adminId: number, isActive: boolean): Promise<void> {
    const res = await adminFetch(
      `${BASE_URL}/admin/manage/admins/${adminId}/toggle-status?is_active=${isActive}`,
      { method: 'POST' }
    )
    return unwrap<void>(res)
  },

  async createAdmin(body: { full_name: string; email: string; password: string }): Promise<AdminRecord> {
    const res = await adminFetch(`${BASE_URL}/admin/auth/create-admin`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return unwrap<AdminRecord>(res)
  },
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const adminSessionsApi = {
  async getSessions(params?: { skip?: number; limit?: number }): Promise<{ sessions: AdminSession[] }> {
    const url = new URL(`${BASE_URL}/admin/manage/sessions`)
    if (params?.skip != null) url.searchParams.set('skip', String(params.skip))
    if (params?.limit != null) url.searchParams.set('limit', String(params.limit))
    const res = await adminFetch(url.toString())
    return unwrap<{ sessions: AdminSession[] }>(res)
  },
}

// ─── Properties (re-exported from adminPropertyApi) ──────────────────────────
export const adminPropertiesApi = {
  async listAll(params?: { limit?: number; skip?: number }): Promise<any[]> {
    const url = new URL(`${BASE_URL}/admin/properties`)
    if (params?.limit != null) url.searchParams.set('limit', String(params.limit))
    if (params?.skip != null) url.searchParams.set('skip', String(params.skip))
    const res = await adminFetch(url.toString())
    if (!res.ok) throw new Error('Failed to load properties')
    return res.json()
  },

  async verify(id: string, verified: boolean): Promise<any> {
    const res = await adminFetch(`${BASE_URL}/admin/properties/${id}/verify?verified=${verified}`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error('Verify failed')
    return res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await adminFetch(`${BASE_URL}/admin/properties/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
  },
}
