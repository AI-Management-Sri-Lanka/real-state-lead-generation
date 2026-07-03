import { fetchWithAuth } from './authApi'
import { Property } from '@/types/property'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export interface PropertyPayload {
  title: string
  price: number
  currency: string
  location: string
  bedrooms: number | null
  bathrooms: number | null
  areaSqft: number | null
  landSizePerches: number | null
  type: string
  listingType: string
  verified: boolean
  furnishing: string | null
  parking: string | null
  listedBy: string
  description: string
}

export interface PropertyImagePayload {
  url: string
  isPrimary: boolean
  sortOrder: number
}

export const propertyApi = {
  // ── FETCH LIST ────────────────────────────────────────────────────────
  async getProperties(params?: { ownerId?: string | number, limit?: number }): Promise<Property[]> {
    const url = new URL(`${BASE_URL}/properties`)
    if (params?.limit) url.searchParams.append('limit', String(params.limit))
    if (params?.ownerId) url.searchParams.append('ownerId', String(params.ownerId))

    // Note: getProperties can be called publicly. fetchWithAuth will attach a token if it exists,
    const res = await fetchWithAuth(url.toString())
    if (!res.ok) throw new Error(`Failed to load properties: ${res.statusText}`)
    return res.json()
  },

  // ── FETCH ONE ─────────────────────────────────────────────────────────
  async getProperty(id: string): Promise<PropertyPayload & { id: string; images?: string[] }> {
    const res = await fetchWithAuth(`${BASE_URL}/properties/${id}`)
    if (!res.ok) throw new Error(`Could not load property: ${res.statusText}`)
    return res.json()
  },

  // ── ADD ─────────────────────────────────────────────────────────────────
  async addProperty(payload: PropertyPayload): Promise<{ id: string | number }> {
    const res = await fetchWithAuth(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Server error: ${res.statusText}`)
    }
    return res.json()
  },

  // ── EDIT ────────────────────────────────────────────────────────────────
  async editProperty(id: string, payload: PropertyPayload): Promise<void> {
    const res = await fetchWithAuth(`${BASE_URL}/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Server error: ${res.statusText}`)
    }
  },

  // ── ADD IMAGE ───────────────────────────────────────────────────────────
  async addPropertyImage(propertyId: string, image: PropertyImagePayload): Promise<void> {
    const res = await fetchWithAuth(`${BASE_URL}/properties/${propertyId}/images`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(image),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Failed to add image: ${res.statusText}`)
    }
  },

  // ── DELETE ──────────────────────────────────────────────────────────────
  async deleteProperty(id: string): Promise<void> {
    const res = await fetchWithAuth(`${BASE_URL}/properties/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Delete failed: ${res.statusText}`)
    }
  }
}
