// src/api/propertyApi.ts
import { fetchWithAuth } from './authApi'
import { BASE_URL } from './config'
import { Property } from '@/types/property'

const ADMIN_BASE = `${BASE_URL}/admin/properties`

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

// ─────────────────────────────────────────────────────────────────────────────
// Owner API  — protected endpoints, attaches JWT automatically via fetchWithAuth
// ─────────────────────────────────────────────────────────────────────────────
export const propertyApi = {
  // Fetch list (public or filtered by ownerId for owner dashboard)
  async getProperties(params?: { ownerId?: string | number; limit?: number }): Promise<Property[]> {
    const url = new URL(`${BASE_URL}/properties`)
    if (params?.limit)   url.searchParams.append('limit',   String(params.limit))
    if (params?.ownerId) url.searchParams.append('ownerId', String(params.ownerId))
    const res = await fetchWithAuth(url.toString())
    if (!res.ok) throw new Error(`Failed to load properties: ${res.statusText}`)
    return res.json()
  },

  // Fetch single property (public — includes nested owner profile)
  async getProperty(id: string): Promise<Property> {
    const res = await fetchWithAuth(`${BASE_URL}/properties/${id}`)
    if (!res.ok) throw new Error(`Could not load property: ${res.statusText}`)
    return res.json()
  },

  // Create a new property (owner)
  async addProperty(payload: PropertyPayload): Promise<Property> {
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

  // Edit own property
  async editProperty(id: string, payload: Partial<PropertyPayload>): Promise<Property> {
    const res = await fetchWithAuth(`${BASE_URL}/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Server error: ${res.statusText}`)
    }
    return res.json()
  },

  // Add image to own property
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

  // Delete own property
  async deleteProperty(id: string): Promise<void> {
    const res = await fetchWithAuth(`${BASE_URL}/properties/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Delete failed: ${res.statusText}`)
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin API — all routes require a Master Admin JWT (stored as aimsl_admin_token)
// ─────────────────────────────────────────────────────────────────────────────
function adminHeader(): HeadersInit {
  const token = localStorage.getItem('aimsl_admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...adminHeader(), ...options.headers },
  })
}

export const adminPropertyApi = {
  // List all properties (admin view — includes owner profile)
  async listAll(params?: { limit?: number; skip?: number; ownerId?: number }): Promise<Property[]> {
    const url = new URL(ADMIN_BASE)
    if (params?.limit)   url.searchParams.append('limit',   String(params.limit))
    if (params?.skip)    url.searchParams.append('skip',    String(params.skip))
    if (params?.ownerId) url.searchParams.append('ownerId', String(params.ownerId))
    const res = await adminFetch(url.toString())
    if (!res.ok) throw new Error(`Failed to load properties: ${res.statusText}`)
    return res.json()
  },

  // Get single property
  async getOne(id: string): Promise<Property> {
    const res = await adminFetch(`${ADMIN_BASE}/${id}`)
    if (!res.ok) throw new Error(`Property not found`)
    return res.json()
  },

  // Create property (optionally on behalf of an owner)
  async create(payload: PropertyPayload, ownerId?: number): Promise<Property> {
    const url = new URL(ADMIN_BASE)
    if (ownerId) url.searchParams.append('ownerId', String(ownerId))
    const res = await adminFetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Create failed: ${res.statusText}`)
    }
    return res.json()
  },

  // Edit any property
  async edit(id: string, payload: Partial<PropertyPayload>): Promise<Property> {
    const res = await adminFetch(`${ADMIN_BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Update failed: ${res.statusText}`)
    }
    return res.json()
  },

  // Delete any property
  async delete(id: string): Promise<void> {
    const res = await adminFetch(`${ADMIN_BASE}/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Delete failed: ${res.statusText}`)
    }
  },

  // Verify / un-verify a property
  async verify(id: string, verified: boolean): Promise<Property> {
    const res = await adminFetch(`${ADMIN_BASE}/${id}/verify?verified=${verified}`, {
      method: 'POST',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Verify failed: ${res.statusText}`)
    }
    return res.json()
  },

  // Add image to any property
  async addPropertyImage(propertyId: string, image: PropertyImagePayload): Promise<void> {
    const res = await adminFetch(`${ADMIN_BASE}/${propertyId}/images`, {
      method: 'POST',
      body: JSON.stringify(image),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Failed to add image: ${res.statusText}`)
    }
  },
}
