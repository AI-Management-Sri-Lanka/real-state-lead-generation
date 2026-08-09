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

let isAdminRefreshing = false
let adminRefreshSubscribers: ((token: string) => void)[] = []

function onAdminRefreshed(token: string) {
  adminRefreshSubscribers.forEach((cb) => cb(token))
  adminRefreshSubscribers = []
}

async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let res = await fetch(url, {
    ...options,
    headers: { ...adminHeaders(), ...options.headers },
  })

  if (res.status === 401) {
    const refreshToken = localStorage.getItem('aimsl_admin_refresh_token')
    if (refreshToken) {
      const isLeader = !isAdminRefreshing
      isAdminRefreshing = true

      // Register to be notified before kicking off the refresh request, so the
      // leader's own resolver is queued before onAdminRefreshed can fire.
      const waitForToken = new Promise<string>((resolve, reject) => {
        adminRefreshSubscribers.push(resolve)
        // Basic timeout to prevent hanging
        setTimeout(() => reject(new Error('Refresh timeout')), 5000)
      }).catch(() => null)

      if (isLeader) {
        try {
          const refreshRes = await fetch(`${BASE_URL}/admin/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          })
          const body = await refreshRes.json()
          if (refreshRes.ok && body?.data?.access_token) {
            localStorage.setItem('aimsl_admin_token', body.data.access_token)
            if (body.data.refresh_token) {
              localStorage.setItem('aimsl_admin_refresh_token', body.data.refresh_token)
            }
            onAdminRefreshed(body.data.access_token)
          } else {
            throw new Error('Refresh failed')
          }
        } catch (e) {
          adminRefreshSubscribers = []
          localStorage.removeItem('aimsl_admin_token')
          localStorage.removeItem('aimsl_admin_refresh_token')
          localStorage.removeItem('aimsl_admin')
          window.location.href = '/admin/login'
        } finally {
          isAdminRefreshing = false
        }
      }

      const newToken = await waitForToken

      if (newToken) {
        // Retry with new token
        res = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
          },
        })
      }
    } else {
      localStorage.removeItem('aimsl_admin_token')
      localStorage.removeItem('aimsl_admin_refresh_token')
      localStorage.removeItem('aimsl_admin')
      window.location.href = '/admin/login'
    }
  } else if (res.status === 403) {
    localStorage.removeItem('aimsl_admin_token')
    localStorage.removeItem('aimsl_admin_refresh_token')
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
  session_id: string
  user_id: number
  title: string
  message_count: number
  updated_at: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const adminDashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const res = await adminFetch(`${BASE_URL}/admin/dashboard/stats`)
    return unwrap<DashboardStats>(res)
  },
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const adminAuthApi = {
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('aimsl_admin_refresh_token')
    if (!refreshToken) return
    try {
      await adminFetch(`${BASE_URL}/admin/auth/logout`, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      })
    } catch (e) {
      console.error('Logout API failed:', e)
    }
  }
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
    await adminFetch(`${BASE_URL}/admin/manage/users/${userId}`, {
      method: 'DELETE'
    })
  },
  
  async resetUserPassword(userId: number, newPassword: string, confirmPassword: string): Promise<void> {
    await adminFetch(`${BASE_URL}/admin/manage/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword })
    })
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

  async createAdmin(body: { full_name: string; email: string; password: string; confirm_password: string }): Promise<AdminRecord> {
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
    return unwrap<any[]>(res)
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

// ─── Chat Transcripts ─────────────────────────────────────────────────────────
export interface AdminMessage {
  id: number
  role: string
  content: string
  timestamp: string
}

export const adminChatApi = {
  async getSessionMessages(sessionId: string): Promise<AdminMessage[]> {
    const res = await adminFetch(`${BASE_URL}/admin/manage/sessions/${sessionId}/messages`)
    return unwrap<AdminMessage[]>(res)
  }
}

// ─── Inquiry Analytics ────────────────────────────────────────────────────────
export interface InquiryAnalytics {
  total_inquiries: number
  leads_by_source: Record<string, number>
  top_properties: { property_id: number, title: string, lead_count: number }[]
  top_owners: { user_id: number, full_name: string, lead_count: number }[]
}

export const adminAnalyticsApi = {
  async getInquiryAnalytics(): Promise<InquiryAnalytics> {
    const res = await adminFetch(`${BASE_URL}/admin/dashboard/analytics/inquiries`)
    return unwrap<InquiryAnalytics>(res)
  }
}

// ─── Global Inquiries ─────────────────────────────────────────────────────────
export interface AdminInquiry {
  id: number
  property_id: number | null
  property_title: string | null
  name: string
  email: string
  phone: string | null
  message: string | null
  source: string
  created_at: string
}

export const adminInquiriesApi = {
  async listAll(params?: { skip?: number; limit?: number }): Promise<{ inquiries: AdminInquiry[], total: number }> {
    const url = new URL(`${BASE_URL}/admin/manage/inquiries`)
    if (params?.skip != null) url.searchParams.set('skip', String(params.skip))
    if (params?.limit != null) url.searchParams.set('limit', String(params.limit))
    const res = await adminFetch(url.toString())
    return unwrap<{ inquiries: AdminInquiry[], total: number }>(res)
  }
}
