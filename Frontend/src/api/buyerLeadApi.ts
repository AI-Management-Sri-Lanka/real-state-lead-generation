// src/api/buyerLeadApi.ts
// API client for buyer lead qualification form

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const BASE_URL = `${API_BASE}/api/v1`

export interface BuyerLeadPayload {
  name: string
  mobile: string
  email: string
  household_income: string
  owns_property: boolean
  available_equity_over_300k?: boolean | null
  deposit_amount?: string | null
  age_group: string
  superannuation_over_230k: boolean
  australian_state: string
  preferred_contact_day: string
  preferred_contact_time: string
}

export async function submitBuyerLead(data: BuyerLeadPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/buyer-leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || err.detail || 'Failed to submit buyer lead')
  }
}