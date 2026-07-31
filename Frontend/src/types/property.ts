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