// Centralized API configuration
// Ensures consistent BASE_URL across all API calls

const envApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

// If the env variable already includes /api/v1, use it directly. Otherwise, append it.
export const BASE_URL = envApiUrl.endsWith('/api/v1') 
  ? envApiUrl 
  : `${envApiUrl}/api/v1`

// For endpoints that don't need /api/v1 prefix
export const API_ROOT = envApiUrl.endsWith('/api/v1') 
  ? envApiUrl.replace(/\/api\/v1$/, '') 
  : envApiUrl
