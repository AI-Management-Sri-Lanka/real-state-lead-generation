import { BASE_URL } from '@/api/config'

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

// ── ADD ─────────────────────────────────────────────────────────────────
// returns the created property so we can read its id and attach images
export async function addProperty(payload: PropertyPayload): Promise<{ id: string | number }> {
  const res = await fetch(`${BASE_URL}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `Server error: ${res.statusText}`)
  }
  return res.json()
}

// ── EDIT ────────────────────────────────────────────────────────────────
export async function editProperty(id: string, payload: PropertyPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/properties/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `Server error: ${res.statusText}`)
  }
}

// ── ADD IMAGE ───────────────────────────────────────────────────────────
// POST /properties/{id}/images — one call per image, exactly like your curl
export async function addPropertyImage(propertyId: string, image: PropertyImagePayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/properties/${propertyId}/images`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(image),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `Failed to add image: ${res.statusText}`)
  }
}

// ── FETCH (for edit pre-fill) ───────────────────────────────────────────
export async function fetchProperty(
  id: string
): Promise<PropertyPayload & { id: string; images?: string[] }> {
  const res = await fetch(`${BASE_URL}/properties/${id}`)
  if (!res.ok) throw new Error(`Could not load property: ${res.statusText}`)
  return res.json()
}

// ── DELETE ──────────────────────────────────────────────────────────────
export async function deleteProperty(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/properties/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `Delete failed: ${res.statusText}`)
  }
}