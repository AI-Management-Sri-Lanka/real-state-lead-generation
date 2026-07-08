# Properties UI — Frontend Documentation

This document covers all property-related pages, components, and API integrations on the frontend.

---

## Routes

| Route | Component | Auth Required | Description |
|---|---|---|---|
| `/properties` | `PropertiesPage` | No | Browse all public listings |
| `/properties/:id` | `PropertyDetailPage` | No | View a single listing |
| `/dashboard/properties` | `MyPropertiesList` | Yes (owner) | Owner's own listings |
| `/dashboard/properties/add` | `PropertyManager` | Yes (owner) | Add or edit a listing |
| `/admin/properties` | `AdminPropertiesPage` | Yes (admin) | Admin moderation table |
| `/admin/properties/add` | `PropertyManager` | Yes (admin) | Admin add/edit any listing |

---

## Public Browsing

### `PropertiesPage.tsx`
**Location:** `src/pages/properties/propertiesPage.tsx`

The main public property listing page.

**Features:**
- Fetches all properties via `propertyApi.getProperties({ limit: 100 })`
- **Search bar** — filters by title, location, or description text
- **Price Range filter** — Under 25M / 25M–50M / 50M+
- **Property Type filter** — House, Apartment, Land, Commercial
- **Listing Type filter** — Sale, Rent
- Responsive card grid using the shared `PropertyCard` component

---

### `PropertyDetailPage.tsx`
**Location:** `src/pages/properties/propertyDetailPage.tsx`

A rich detail view for a single property.

**Features:**
- Fetches `GET /properties/{id}` and displays all fields
- Image gallery (primary image + thumbnails)
- Detail chips: bedrooms, bathrooms, sqft, land size, furnishing
- Owner contact section with an enquiry form
- "Verified" badge displayed if property is verified by admin
- Back button returns to the previous page (`useNavigate(-1)`)

---

### `PropertyCard.tsx`
**Location:** `src/components/properties/propertyCard.tsx`

A reusable card component used across the homepage, properties page, and owner dashboard.

**Features:**
- Displays: image (with zoom-on-hover), price, title, location, bed/bath/sqft chips, type/listing type badges
- **Hover micro-interactions:**
  - Card lifts up (`-translate-y-1.5`) with a deep indigo shadow
  - Image scales up (`group-hover:scale-110`)
  - "View Details" pill slides up and fades in over the image
- **Favorite button** (public views only) — heart icon with toggle animation
- **Three-dot menu** (owner views only) — Edit and Delete actions
- Navigates to `/properties/{id}` on click

---

## Homepage Property Discovery

### `HomePage.tsx`
**Location:** `src/pages/home/HomePage.tsx`

The homepage has been redesigned for maximum property discovery.

**Sections:**
1. **Hero section** — Reduced to ~65–70vh so users immediately see content below
2. **Quick Search bar** — Inline dropdowns for property type and price range; clicking Search routes to `/properties` with filters
3. **Category Chips** — Horizontal scrolling pills (All, Houses, Apartments, etc.) that instantly filter the featured grid
4. **Featured Properties Grid** — Fetches 12 latest properties from the API on mount
5. **"View All Properties" CTA** — Button below the grid to browse everything

---

## Owner Dashboard

### `MyPropertiesList.tsx`
**Location:** `src/pages/dashboard/properties/MyPropertiesList.tsx`

The owner's personal property management page (inside the user dashboard).

**Features:**
- Fetches only properties belonging to the logged-in user
- Card grid with `onEdit` and `onDelete` callbacks passed to `PropertyCard`
- Edit → routes to `/dashboard/properties/add?id={id}` (pre-fills `PropertyManager` form)
- Delete → calls `DELETE /properties/{id}`

---

### `PropertyManager.tsx`
**Location:** `src/pages/dashboard/properties/PropertyManager.tsx`

A shared, powerful form for creating and editing properties. Used by both **owners** and **admins**.

**How it detects context:**
- Reads `?id=` from the URL query string to determine edit mode
- Checks whether the current token is `aimsl_admin_token` (admin) or the user token, and calls the appropriate API accordingly

**Fields:**
- Title, Price, Currency, Location
- Bedrooms, Bathrooms, Area (sqft), Land Size (perches)
- Property Type (dropdown), Listing Type (dropdown)
- Furnishing (dropdown), Parking, Listed By
- Description
- Images (URL list with add/remove)

**Dropdowns** use a reusable `CustomSelect` component with a polished dropdown UI.

---

## API Client — `propertyApi.ts`

**Location:** `src/api/propertyApi.ts`

```typescript
// Public endpoints (no auth needed)
propertyApi.getProperties(params)       // GET /properties
propertyApi.getPropertyById(id)         // GET /properties/{id}

// Owner endpoints (requires user JWT)
propertyApi.createProperty(body)        // POST /properties
propertyApi.updateProperty(id, body)    // PATCH /properties/{id}
propertyApi.deleteProperty(id)          // DELETE /properties/{id}
propertyApi.addImage(id, url)           // POST /properties/{id}/images
propertyApi.deleteImage(propId, imgId)  // DELETE /properties/{id}/images/{imgId}

// Admin endpoints (requires aimsl_admin_token)
// Note: These have been moved to src/api/adminApi.ts → adminPropertiesApi
adminPropertiesApi.listAll(params)      // GET /admin/properties
adminPropertiesApi.verify(id, bool)     // POST /admin/properties/{id}/verify
adminPropertiesApi.delete(id)           // DELETE /admin/properties/{id}
```

---

## Property Type Reference (Frontend)

```typescript
type Property = {
  id: string              // e.g. "prop-42"
  title: string
  price: number
  currency: string        // "AUD", "USD", etc.
  location: string
  bedrooms?: number
  bathrooms?: number
  areaSqft?: number
  landSizePerches?: number
  type: 'House' | 'Apartment' | 'Land' | 'Commercial'
  listingType: 'Sale' | 'Rent'
  verified: boolean
  furnishing?: 'Unfurnished' | 'Semi-Furnished' | 'Fully-Furnished'
  parking?: string
  listedBy?: string
  description?: string
  ownerId?: number
  owner?: { id: number; full_name: string; email: string }
  images: string[]        // Array of image URLs
}
```
