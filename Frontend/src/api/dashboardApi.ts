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
