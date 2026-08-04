# Backend Changelog

All notable changes to the backend are documented here.

---

## [Latest] — 2026-07-08

### Admin — Dashboard Stats Enhanced
**File:** `app/crud/dashboard_crud.py`

The `GET /admin/dashboard/stats` endpoint now returns significantly richer analytics data:

**Added fields:**
- `active_users` — Count of users where `is_active = true`
- `inactive_users` — Count of banned/deactivated users
- `new_users_last_7_days` — Newly registered users in the past 7 days
- `verified_properties` — Count of properties with `is_verified = true`
- `unverified_properties` — Properties pending admin review
- `properties_by_type` — Dict breakdown: `{ "House": 20, "Apartment": 15, ... }`

**Previously returned:** Only `total_users`, `total_properties`, `total_chat_sessions`.

---

### Admin — Permanent User Deletion Endpoint Added
**File:** `app/api/v1/admin_manage_router.py`

**New endpoint:** `DELETE /api/v1/admin/manage/users/{user_id}`

- Allows master admins to **permanently delete** a user account.
- Cascades to delete all associated sessions.
- Properties owned by the user will have `owner_id` set to `NULL` (via `ondelete="SET NULL"`).
- Returns `HTTP 204 No Content` on success.
- Returns `HTTP 404` if user is not found.

---

## [Previous] — 2026-07-03

### Properties System
- Full property CRUD for owners (`app/api/v1/property_router.py`)
- Admin property management with verify/unverify (`app/api/v1/admin_property_router.py`)
- Property image upload/delete endpoints

### Admin Management
- Admin user listing and status toggle (`app/api/v1/admin_manage_router.py`)
- Master admin authentication with separate JWT (`app/api/v1/admin_auth_router.py`)
- Bootstrap endpoint to create first admin (auto-locks after use)
