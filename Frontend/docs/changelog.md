# Frontend Changelog

All notable changes to the frontend are documented here.

---

## [Latest] — 2026-07-08

### Master Admin Portal Overhaul
Converted the isolated administration pages into a comprehensive SaaS control panel.

**Added components:**
- [`AdminLayout.tsx`](../src/pages/admin/AdminLayout.tsx) — Collapsible dark sidebar navigation with a top status bar, active menu highlighting, user profile display, and logout controls.
- [`AdminDashboardPage.tsx`](../src/pages/admin/AdminDashboardPage.tsx) — Main dashboard metrics showing user accounts, listings, chat sessions, and verification percentage. Includes inline SVG charts (verification donut chart & properties type bar chart).
- [`AdminUsersPage.tsx`](../src/pages/admin/AdminUsersPage.tsx) — Moderation table of all registered users with avatar initials, search filtering, ban/unban toggles, and permanent account deletion actions.
- [`AdminSessionsPage.tsx`](../src/pages/admin/AdminSessionsPage.tsx) — AI chat session monitoring tool showing chat titles, message counts, and timestamps.
- [`AdminManagePage.tsx`](../src/pages/admin/AdminManagePage.tsx) — Master admin user registry showing credentials, status control (with self-deactivation blocker), and invitation forms to create new admin users.
- [`adminApi.ts`](../src/api/adminApi.ts) — Consolidated admin-only HTTP request library with automatic 401/403 session expiration handler.

**Routing upgrades:**
- Grouped all admin routes as child paths nested inside the shared `AdminLayout` layout template.
- Updated route login page redirection targeting `/admin/dashboard` instead of the properties view.

---

## [Previous Updates] — 2026-07-08

### Buyer Experience Redesign
Overhauled the homepage for immediate property discovery.

**Changes:**
- **Hero Section Height:** Reduced banner height to allow the property grid to peak from underneath, encouraging visitors to scroll.
- **Embedded Search Bar:** Introduced an inline search bar between the hero banner and grid with type & price dropdowns.
- **Horizontal Category Chips:** Added quick in-memory category filters (All, Houses, Apartments, etc.) for instant sorting of featured listings.
- **Featured Grid:** Redesigned the grid to pull real listings from the database dynamically on page mount.
- **Card Micro-interactions:** Upgraded property cards with lift hover movements, deep shadow drops, image scaling, overlay "View Details" buttons, and an animated heart "Favorite" button.
