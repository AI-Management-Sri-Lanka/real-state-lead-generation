// src/api/propertyApi.ts
import { fetchWithAuth } from './authApi'
import { BASE_URL } from './config'
import { Property, normalizeImages } from '@/types/property'

// Backend responses aren't always consistent about how they shape/name image
// fields (missing images on list endpoints, snake_case keys, relative URLs).
// Normalize every property that comes through this API layer so the rest of
// the app can trust `property.images` is always well-formed.
function normalizeProperty(p: Property): Property {
  return { ...p, images: normalizeImages(p.images) }
}
function normalizeProperties(list: Property[]): Property[] {
  return Array.isArray(list) ? list.map(normalizeProperty) : list
}

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
  phoneNumber: string | null
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
  async getProperties(params?: { ownerId?: string | number; limit?: number; skip?: number }): Promise<Property[]> {
    const url = new URL(`${BASE_URL}/properties`)
    if (params?.limit)   url.searchParams.append('limit',   String(params.limit))
    if (params?.skip)    url.searchParams.append('skip',    String(params.skip))
    if (params?.ownerId) url.searchParams.append('ownerId', String(params.ownerId))
    const res = await fetchWithAuth(url.toString())
    if (!res.ok) throw new Error(`Failed to load properties: ${res.statusText}`)
    const body = await res.json()
    return normalizeProperties(body.data)
  },

  // Fetch single property (public — includes nested owner profile)
  async getProperty(id: string): Promise<Property> {
    const res = await fetchWithAuth(`${BASE_URL}/properties/${id}`)
    if (!res.ok) throw new Error(`Could not load property: ${res.statusText}`)
    const body = await res.json()
    return normalizeProperty(body.data)
  },

  // Create a new property (owner)
  async addProperty(payload: PropertyPayload): Promise<Property> {
    const res = await fetchWithAuth(`${BASE_URL}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.message ?? `Server error: ${res.statusText}`)
    }
    return normalizeProperty(body.data)
  },

  // Edit own property
  async editProperty(id: string, payload: Partial<PropertyPayload>): Promise<Property> {
    const res = await fetchWithAuth(`${BASE_URL}/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.message ?? `Server error: ${res.statusText}`)
    }
    return normalizeProperty(body.data)
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

  // Remove an image from own property
  async deletePropertyImage(propertyId: string, imageId: number): Promise<void> {
    const res = await fetchWithAuth(`${BASE_URL}/properties/${propertyId}/images/${imageId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Failed to remove image: ${res.statusText}`)
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
    const body = await res.json()
    return normalizeProperties(body.data)
  },

  // Get single property
  async getOne(id: string): Promise<Property> {
    const res = await adminFetch(`${ADMIN_BASE}/${id}`)
    if (!res.ok) throw new Error(`Property not found`)
    const body = await res.json()
    return normalizeProperty(body.data)
  },

  // Create property (optionally on behalf of an owner)
  async create(payload: PropertyPayload, ownerId?: number): Promise<Property> {
    const url = new URL(ADMIN_BASE)
    if (ownerId) url.searchParams.append('ownerId', String(ownerId))
    const res = await adminFetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.message ?? `Create failed: ${res.statusText}`)
    }
    return normalizeProperty(body.data)
  },

  // Edit any property
  async edit(id: string, payload: Partial<PropertyPayload>): Promise<Property> {
    const res = await adminFetch(`${ADMIN_BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.message ?? `Update failed: ${res.statusText}`)
    }
    return normalizeProperty(body.data)
  },

  // Remove an image from any property
  async deletePropertyImage(propertyId: string, imageId: number): Promise<void> {
    const res = await adminFetch(`${ADMIN_BASE}/${propertyId}/images/${imageId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? `Failed to remove image: ${res.statusText}`)
    }
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
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body?.message ?? `Verify failed: ${res.statusText}`)
    }
    return body.data
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