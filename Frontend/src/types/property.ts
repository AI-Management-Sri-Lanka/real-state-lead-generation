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

export function getCoverImageUrl(images: Property['images'] | undefined | null): string | null {
  if (!images || images.length === 0) return null
  const primary = images.find(img => img.isPrimary)
  return (primary ?? images[0]).url
}