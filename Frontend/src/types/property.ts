// src/types/property.ts
import { API_ROOT } from '@/api/config'

export interface OwnerProfile {
  id: number
  full_name: string
  email: string
}

export interface Property {
  id: string
  ownerId?: number
  owner?: OwnerProfile
  title: string
  price: number
  currency: string
  type: 'Apartment' | 'House' | 'Land' | 'Commercial'
  listingType: 'Sale' | 'Rent'
  location: string
  bedrooms: number | null
  bathrooms: number | null
  areaSqft: number | null
  landSizePerches?: number
  furnishing: string | null
  parking: string | null
  listedBy: string
  phoneNumber: string | null
  verified: boolean
  description: string | null
  images: PropertyImage[]
}

export interface PropertyImage {
  id: number
  url: string
  isPrimary: boolean
  sortOrder: number
}

export interface InquiryPayload {
  propertyId: string
  name: string
  email: string
  phone?: string
  message: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Image helpers
// ─────────────────────────────────────────────────────────────────────────────

// The backend may return image URLs as absolute ("https://cdn.example.com/x.jpg")
// or relative ("/uploads/x.jpg"). Relative URLs need to be resolved against the
// API's origin, NOT the frontend's origin, or the <img> tag will 404.
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url
  return `${API_ROOT}${url.startsWith('/') ? '' : '/'}${url}`
}

// Normalizes whatever shape the backend sends for a property's images into the
// PropertyImage[] shape this app expects. Handles:
//  - plain string URLs instead of objects
//  - snake_case keys (image_url, is_primary, sort_order) instead of camelCase
//  - missing/relative URLs
export function normalizeImages(raw: unknown): PropertyImage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((img: any, i: number): PropertyImage | null => {
      if (typeof img === 'string') {
        const url = resolveImageUrl(img)
        return url ? { id: i, url, isPrimary: i === 0, sortOrder: i } : null
      }
      if (img && typeof img === 'object') {
        const rawUrl = img.url ?? img.image_url ?? img.imageUrl ?? img.path ?? null
        const url = resolveImageUrl(rawUrl)
        if (!url) return null
        return {
          id: img.id ?? i,
          url,
          isPrimary: img.isPrimary ?? img.is_primary ?? i === 0,
          sortOrder: img.sortOrder ?? img.sort_order ?? i,
        }
      }
      return null
    })
    .filter((img): img is PropertyImage => img !== null)
}

export function getCoverImageUrl(images: Property['images'] | undefined | null): string | null {
  if (!images || images.length === 0) return null
  const primary = images.find(img => img.isPrimary)
  return (primary ?? images[0]).url
}