// src/types/property.ts

export interface Property {
  id: string
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
  verified: boolean
  description: string
  images: string[]
}

export interface InquiryPayload {
  propertyId: string
  name: string
  email: string
  phone: string
  message: string
}