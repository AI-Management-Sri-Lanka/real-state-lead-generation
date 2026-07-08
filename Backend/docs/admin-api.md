# Admin API Documentation

All endpoints under `/api/v1/admin/*` are restricted to **Master Admins only**.  
Authentication is via a separate JWT token stored as `aimsl_admin_token`.

## Authentication

Every admin endpoint requires the following header:
```
Authorization: Bearer <aimsl_admin_token>
```

A 401 or 403 response means the token is missing, expired, or belongs to a regular user.

---

## Auth Router — `/admin/auth`

### `POST /admin/auth/bootstrap`
> Create the very first master admin account. **Locks after first use.**

**Body:**
```json
{
  "full_name": "Jane Admin",
  "email": "admin@example.com",
  "password": "strongpassword"
}
```

---

### `POST /admin/auth/login`
> Authenticate a master admin and receive a JWT token.

**Body:**
```json
{ "email": "admin@example.com", "password": "strongpassword" }
```

**Response:**
```json
{
  "access_token": "<jwt>",
  "admin": { "id": 1, "email": "admin@example.com", "full_name": "Jane Admin" }
}
```

---

### `GET /admin/auth/me`
> Returns the currently authenticated admin's profile.

---

### `POST /admin/auth/create-admin`
> *(Requires existing admin token)* Create a new master admin account.

**Body:**
```json
{ "full_name": "Bob Admin", "email": "bob@example.com", "password": "password123" }
```

---

### `PUT /admin/auth/me`
> Update the current admin's own profile (name/email).

---

### `PUT /admin/auth/change-password`
> Change the current admin's password.

**Body:**
```json
{ "current_password": "old", "new_password": "newstrong" }
```

---

## Dashboard Router — `/admin/dashboard`

### `GET /admin/dashboard/stats`
> Returns rich platform-wide analytics for the admin dashboard.

**Response shape:**
```json
{
  "total_users": 120,
  "active_users": 115,
  "inactive_users": 5,
  "new_users_last_7_days": 12,
  "total_properties": 48,
  "verified_properties": 31,
  "unverified_properties": 17,
  "properties_by_type": {
    "House": 20,
    "Apartment": 15,
    "Land": 10,
    "Commercial": 3
  },
  "total_chat_sessions": 340
}
```

> **Added in latest update:** `new_users_last_7_days`, `active_users`, `inactive_users`, `properties_by_type`.

---

## Manage Router — `/admin/manage`

### `GET /admin/manage/admins`
> List all master admin accounts (paginated).

Query params: `skip`, `limit`

---

### `POST /admin/manage/admins/{admin_id}/toggle-status`
> Activate or deactivate another admin. Cannot deactivate yourself.

Query params: `is_active=true|false`

---

### `GET /admin/manage/users`
> List all registered property owners/users (paginated).

Query params: `skip`, `limit`

---

### `GET /admin/manage/users/{user_id}`
> Get details for a single user.

---

### `POST /admin/manage/users/{user_id}/toggle-status`
> Ban or unban a user account.

Query params: `is_active=true|false`

---

### `DELETE /admin/manage/users/{user_id}` ⭐ New
> **Permanently delete** a user account and all their associated data (properties, sessions).

> ⚠️ This action is irreversible. The user's properties will have their `owner_id` set to NULL due to the `ondelete="SET NULL"` cascade.

---

### `GET /admin/manage/properties`
> View all properties across all users (bypasses owner restrictions).

Query params: `skip`, `limit`

---

### `GET /admin/manage/sessions`
> View all AI chat sessions across the platform.

Query params: `skip`, `limit`

---

## Properties Router — `/admin/properties`

See [`properties-api.md`](./properties-api.md) for the full admin property endpoints.
