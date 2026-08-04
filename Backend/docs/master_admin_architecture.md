# Master Admin Architecture

This document outlines the architecture, setup process, database schemas, and privileges of the Master Admin system within the Real Estate Lead Generation platform.

## 1. Overview
The Master Admin architecture is designed to provide a highly secure, isolated environment for platform-level administrators. It ensures a strict separation between regular business users (property owners, seekers) and the internal team managing the platform.

## 2. Database Schema
Master Admins are stored in a dedicated, isolated table rather than relying on a simple "role" flag in the regular `users` table. This prevents privilege escalation vulnerabilities.

**Table:** `master_admins`
- `id` (Integer, Primary Key)
- `full_name` (String)
- `email` (String, Unique)
- `hashed_password` (String)
- `is_active` (Boolean, Default: True) - Used to revoke access.
- `created_at` (DateTime)
- `updated_at` (DateTime)

## 3. Setup Process (Bootstrapping)
Because Master Admins are isolated and there is no public "Sign Up" page, the system provides a secure bootstrapping mechanism.

**How to Bootstrap the First Admin:**
1. Ensure the database is running and migrations are applied.
2. Send a `POST` request to `/api/v1/admin/auth/bootstrap` with the following JSON payload:
   ```json
   {
       "full_name": "Admin Name",
       "email": "admin@example.com",
       "password": "SecurePassword123!"
   }
   ```
3. **Security Lock:** Once at least one Master Admin exists in the database, the `/bootstrap` endpoint permanently locks and will return a `403 Permission Denied` for all future requests.

## 4. Authentication & Security Guard
**Login Flow (`POST /api/v1/admin/auth/login`):**
When a Master Admin logs in successfully, the system issues a specialized JWT token. 

**The Master Admin Claim:**
The token payload includes a critical security claim: `"is_master_admin": true`. 

**The Security Dependency (`require_master_admin`):**
All platform management routes are protected by the `require_master_admin` FastAPI dependency. 
- It intercepts the request and decodes the JWT.
- It verifies the presence of the `"is_master_admin": true` claim.
- It checks the database to ensure the admin account is still `is_active=True`.
- If a regular user attempts to use their standard token on these routes, they are immediately rejected.

## 5. Functions and Privileges
Master Admins have widespread access across the platform. Below are the specific functionalities available to them:

### A. Admin Team Management
- **Create New Admins:** Current admins can invite and create new team members (`POST /api/v1/admin/auth/create-admin`).
- **Manage Access:** Admins can view the full roster (`GET /api/v1/admin/manage/admins`) and instantly revoke or grant access to another admin (`POST /api/v1/admin/manage/admins/{id}/toggle-status`). *Note: Admins cannot deactivate their own accounts.*
- **Profile Management:** Admins can update their own name and change their password.

### B. User Moderation
- **List All Users:** Access a paginated list of all registered users on the platform (`GET /api/v1/admin/manage/users`).
- **View User Details:** View deep details on a specific user (`GET /api/v1/admin/manage/users/{id}`).
- **Ban/Unban Users:** Toggle a user's active status, effectively banning property owners or fraudulent accounts (`POST /api/v1/admin/manage/users/{id}/toggle-status`).

### C. Content & Data Oversight
- **Global Properties List:** View a paginated list of every property listed on the platform across all users (`GET /api/v1/admin/manage/properties`).
- **Global Chat Sessions:** View all AI chat sessions generated on the platform to monitor usage and bot performance (`GET /api/v1/admin/manage/sessions`).

### D. Analytics Dashboard
- **Platform Stats:** Retrieve high-level aggregate data representing the health of the platform, including the total count of users, properties, and chat sessions (`GET /api/v1/admin/dashboard/stats`).
