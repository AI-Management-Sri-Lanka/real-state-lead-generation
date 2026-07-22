# Properties API Documentation

This document covers all property-related endpoints — both for **regular property owners** and **master admins**.

---

## Property ID Format

Properties use a prefixed string ID on the frontend: `prop-{integer}`.  
Backend endpoints accept both `prop-123` and the raw integer `123`.

---

## Owner Endpoints — `/properties`

All owner endpoints require a standard user JWT:
```
Authorization: Bearer <access_token>
```

### `GET /properties`
> List properties. Without auth, shows all public listings. With auth, can filter by owner.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `type` | string | Filter by property type (`House`, `Apartment`, `Land`, `Commercial`) |
| `listingType` | string | `Sale` or `Rent` |
| `min_price` | float | Minimum price |
| `max_price` | float | Maximum price |
| `min_beds` | int | Minimum bedrooms |
| `verified` | bool | Only verified listings |
| `ownerId` | int | Filter by owner user ID |
| `skip` | int | Pagination offset |
| `limit` | int | Results per page (max 100) |

---

### `POST /properties`
> Create a new property listing (authenticated owners only).

**Body:**
```json
{
  "title": "Modern 3BR House in Sydney",
  "price": 950000,
  "currency": "AUD",
  "location": "Sydney, NSW",
  "bedrooms": 3,
  "bathrooms": 2,
  "areaSqft": 1800,
  "type": "House",
  "listingType": "Sale",
  "description": "Beautiful home...",
  "listedBy": "Owner Name"
}
```

---

### `GET /properties/{property_id}`
> Get a single property by ID (public).

---

### `PATCH /properties/{property_id}`
> Update a property. Only the **owner** of the property can update it.

**Body:** Any subset of the property fields. Only changed fields need to be sent.

---

### `DELETE /properties/{property_id}`
> Delete a property. Only the **owner** can delete their own listing.

---

### `POST /properties/{property_id}/images`
> Add an image URL to a property.

**Body:**
```json
{ "url": "https://example.com/photo.jpg", "is_primary": true }
```

---

### `DELETE /properties/{property_id}/images/{image_id}`
> Remove an image from a property.

---

## Admin Property Endpoints — `/admin/properties`

All admin endpoints require the master admin JWT:
```
Authorization: Bearer <aimsl_admin_token>
```

Admins can perform full CRUD on **any** property regardless of who owns it.

---

### `GET /admin/properties`
> List ALL properties across ALL users with owner profile embedded.

Same filter query params as the public endpoint, plus:
- `ownerId` — filter by a specific user's properties

---

### `POST /admin/properties`
> Create a property, optionally assigning it to an existing user.

Query params:
- `ownerId` — (optional) assign to this user ID. Defaults to admin-owned (0).

---

### `GET /admin/properties/{property_id}`
> Fetch a single property by ID.

---

### `PATCH /admin/properties/{property_id}`
> Edit any property regardless of owner.

---

### `DELETE /admin/properties/{property_id}`
> Permanently delete any property.

---

### `POST /admin/properties/{property_id}/verify` ⭐ Key Feature
> Toggle the verified badge on a listing.

Query params:
- `verified=true` — Grant the verified badge
- `verified=false` — Remove the verified badge

Verified listings display a **green "Verified" shield badge** on the frontend.

---

### `POST /admin/properties/{property_id}/images`
> Add an image to any property.

---

### `DELETE /admin/properties/{property_id}/images/{image_id}`
> Remove an image from any property.

---

## Property Schema Reference

```json
{
  "id": "prop-42",
  "title": "Modern 3BR House",
  "price": 950000.0,
  "currency": "AUD",
  "location": "Sydney, NSW",
  "bedrooms": 3,
  "bathrooms": 2,
  "areaSqft": 1800.0,
  "landSizePerches": null,
  "type": "House",
  "listingType": "Sale",
  "verified": true,
  "furnishing": "Fully-Furnished",
  "parking": "2 car garage",
  "listedBy": "John Smith",
  "description": "Beautiful home...",
  "ownerId": 12,
  "owner": {
    "id": 12,
    "full_name": "John Smith",
    "email": "john@example.com"
  },
  "images": [
    { "id": 1, "url": "https://...", "is_primary": true, "sort_order": 0 }
  ]
}
```

## Property Types
- `House`
- `Apartment`
- `Land`
- `Commercial`

## Listing Types
- `Sale`
- `Rent`

## Furnishing Options
- `Unfurnished`
- `Semi-Furnished`
- `Fully-Furnished`
