import { fetchWithAuth } from './authApi'
import { BASE_URL } from './config'

export interface DashboardStats {
  total_sessions: number
  sessions_today: number
  active_sessions: number
  total_messages: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetchWithAuth(`${BASE_URL}/dashboard/stats`)
  if (!res.ok) throw new Error('Failed to fetch dashboard stats')
  const body = await res.json() as { success: boolean; data: DashboardStats }
  return body.data
}

export interface OwnerDashboardStats {
  total_leads: number
  qualified_leads: number
  new_leads_today: number
  ai_match_rate: string
  leads_by_source: {
    source: string
    percentage: number
    amount: number
    color: string
  }[]
  score_breakdown: {
    label: string
    percentage: number
    color: string
  }[]
  recent_leads: {
    id: number
    name: string
    email: string
    phone?: string
    location: string
    amount: string
    score: 'High' | 'Medium' | 'Low'
    initials: string
    color: string
    created_at: string
  }[]
}

export async function fetchOwnerDashboardStats(): Promise<OwnerDashboardStats> {
  const res = await fetchWithAuth(`${BASE_URL}/dashboard/owner/stats`)
  if (!res.ok) throw new Error('Failed to fetch owner dashboard stats')
  const body = await res.json() as { success: boolean; data: OwnerDashboardStats }
  return body.data
}

