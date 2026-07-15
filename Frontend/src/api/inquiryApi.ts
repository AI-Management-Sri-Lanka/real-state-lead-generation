import { fetchWithAuth } from './authApi'
import { BASE_URL } from './config'

export interface InquiryPayload {
  property_id?: number
  name: string
  email: string
  phone?: string
  message?: string
  source?: string
}

export async function submitInquiry(payload: InquiryPayload): Promise<any> {
  const res = await fetch(`${BASE_URL}/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody?.message ?? 'Failed to submit inquiry')
  }
  const body = await res.json()
  return body.data
}
