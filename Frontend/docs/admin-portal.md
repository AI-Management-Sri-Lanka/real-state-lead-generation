# Master Admin Portal — Frontend Documentation

The Master Admin portal is a completely isolated section of the frontend, protected by a separate authentication token and rendered inside a dedicated sidebar layout.

---

## Accessing the Admin Portal

| Action | URL |
|---|---|
| Login page | `http://localhost:5173/admin/login` |
| Dashboard | `http://localhost:5173/admin/dashboard` |
| Properties | `http://localhost:5173/admin/properties` |
| Users | `http://localhost:5173/admin/users` |
| Sessions | `http://localhost:5173/admin/sessions` |
| Admin Accounts | `http://localhost:5173/admin/manage` |

> The admin portal uses a **completely separate JWT** (`aimsl_admin_token` in `localStorage`).  
> Logging in as a regular user at `/auth/signin` does NOT grant access to admin routes.

---

## Authentication Flow

1. Admin navigates to `/admin/login`
2. Submits credentials → backend returns `aimsl_admin_token` + admin profile
3. Token and profile stored in `localStorage`:
   - `aimsl_admin_token` — the JWT for all admin API calls
   - `aimsl_admin` — JSON object `{ id, email, full_name }`
4. On success → redirected to `/admin/dashboard`
5. The `AdminRoute` guard checks `localStorage` for the token before rendering any admin page
6. The `adminApi.ts` client automatically redirects to `/admin/login` on any `401`/`403` response

---

## Route Guard

```tsx
// In App.tsx
function AdminRoute({ children }) {
  const hasAdminToken = !!localStorage.getItem('aimsl_admin_token')
  return hasAdminToken ? children : <Navigate to="/admin/login" replace />
}
```

All admin pages are wrapped in `<AdminRoute>` and rendered as children of `<AdminLayout>` via React Router's `<Outlet>`.

---

## File Structure

```
src/
├── api/
│   └── adminApi.ts              ← Dedicated admin API client
└── pages/
    └── admin/
        ├── AdminLayout.tsx      ← Shared sidebar + topbar shell
        ├── AdminLoginPage.tsx   ← Isolated login portal
        ├── AdminDashboardPage.tsx
        ├── AdminPropertiesPage.tsx
        ├── AdminUsersPage.tsx
        ├── AdminSessionsPage.tsx
        └── AdminManagePage.tsx
```

---

## `adminApi.ts` — API Client

**Location:** `src/api/adminApi.ts`

A dedicated fetch wrapper that:
- Reads `aimsl_admin_token` from `localStorage` and injects it as `Authorization: Bearer <token>`
- Automatically redirects to `/admin/login` on `401`/`403` responses
- Exports strongly-typed functions grouped by domain

### Exported Groups

| Export | Purpose |
|---|---|
| `adminDashboardApi.getStats()` | Fetch platform-wide analytics |
| `adminUsersApi.getUsers()` | Paginated user list |
| `adminUsersApi.toggleUserStatus(id, bool)` | Ban / unban a user |
| `adminUsersApi.deleteUser(id)` | Permanently delete a user |
| `adminMgmtApi.getAdmins()` | List all master admins |
| `adminMgmtApi.toggleAdminStatus(id, bool)` | Activate / deactivate an admin |
| `adminMgmtApi.createAdmin(body)` | Invite a new admin |
| `adminSessionsApi.getSessions()` | All chat sessions |
| `adminPropertiesApi.listAll()` | All properties (any owner) |
| `adminPropertiesApi.verify(id, bool)` | Toggle verified badge |
| `adminPropertiesApi.delete(id)` | Delete any property |

---

## `AdminLayout.tsx` — Sidebar Shell

**Location:** `src/pages/admin/AdminLayout.tsx`

A persistent layout that wraps all admin pages. It renders:
- **Collapsible dark sidebar** — Toggle with the menu button in the top bar
- **Navigation links:** Dashboard, Properties, Users, Sessions, Admins (active link highlighted)
- **Admin profile section** — Shows name, email, and a logout button at the bottom
- **Top bar** — Contains the collapse toggle, a bell icon, and a "← View site" link

All admin pages render into the `<Outlet />` inside this layout.

---

## Pages Reference

### `AdminDashboardPage.tsx`
**Route:** `/admin/dashboard`

- 4 metric cards: Total Users, Properties, Verified Rate, AI Sessions
- Donut chart (pure SVG): Verified vs. Unverified properties
- Bar chart (pure CSS): Properties broken down by type
- Quick action cards linking to each management section
- Refresh button to re-fetch all stats

---

### `AdminPropertiesPage.tsx`
**Route:** `/admin/properties`

- Fetches all properties via `adminPropertiesApi.listAll({ limit: 500 })`
- Real-time client-side search by title, location, owner name, or email
- Data table with columns: Property (image + details), Owner, Price, Status, Actions
- **Actions per row:**
  - 🔗 View public page (opens in new tab)
  - ✅/❌ Toggle verified badge
  - ✏️ Edit (links to `/admin/properties/add?id=...`)
  - 🗑️ Delete (with confirmation dialog)
- Stats strip: Total / Verified / Unverified counts

---

### `AdminUsersPage.tsx`
**Route:** `/admin/users`

- Fetches all users via `adminUsersApi.getUsers({ limit: 500 })`
- Real-time search by name or email
- Data table with columns: User (avatar + name), Email, Status, Joined Date, Actions
- **Actions per row:**
  - Ban / Unban toggle button
  - Delete button (permanent, with confirmation)
- Stats strip: Total / Active / Banned counts
- Avatars are auto-generated with colour-coded initials

---

### `AdminSessionsPage.tsx`
**Route:** `/admin/sessions`

- Read-only monitoring view of all AI chat sessions
- Fetches via `adminSessionsApi.getSessions()`
- Columns: Session title + ID, User ID, Message count, Created date
- Real-time search by title or user ID

---

### `AdminManagePage.tsx`
**Route:** `/admin/manage`

- Lists all master admin accounts from `adminMgmtApi.getAdmins()`
- **Activate / Deactivate** toggle (cannot deactivate yourself — safeguard in place)
- **"Invite Admin" modal** — form with full name, email, password fields; calls `adminMgmtApi.createAdmin()`
- Shows a "You" badge next to the currently logged-in admin's row

---

## Routing (App.tsx)

```tsx
// All admin pages are nested under AdminLayout via React Router Outlet
<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
  <Route index element={<Navigate to="/admin/dashboard" replace />} />
  <Route path="dashboard"      element={<AdminDashboardPage />} />
  <Route path="properties"     element={<AdminPropertiesPage />} />
  <Route path="properties/add" element={<PropertyManager />} />
  <Route path="users"          element={<AdminUsersPage />} />
  <Route path="sessions"       element={<AdminSessionsPage />} />
  <Route path="manage"         element={<AdminManagePage />} />
</Route>
```
