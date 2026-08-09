// src/types/property.ts

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
  images: string[] | { url: string; isPrimary: boolean }[]
}

export interface InquiryPayload {
  propertyId: string
  name: string
  email: string
  phone?: string
  message: string
}

// The API returns images in DB insertion order, and edits always append the
// newly uploaded image at the end — so the most recently added image (last
// in the array) is the one that should represent the property, not the first.
export function getCoverImageUrl(images: Property['images'] | undefined | null): string | null {
  if (!images || images.length === 0) return null
  const latest = images[images.length - 1]
  return typeof latest === 'string' ? latest : latest.url
}