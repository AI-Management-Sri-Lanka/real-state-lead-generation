// Centralized API configuration
// Ensures consistent BASE_URL across all API calls

let rawApiUrl = import.meta.env.VITE_API_URL || '';
// Handle docker-compose passing literal quotes
if (rawApiUrl === '""' || rawApiUrl === "''") {
  rawApiUrl = '';
}

// Fallback to dynamic window.location.hostname:8000 if VITE_API_URL is not set
const defaultApiUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:8000`
  : 'http://localhost:8000';

const envApiUrl = (rawApiUrl || defaultApiUrl).replace(/\/$/, '');

// Ensure absolute URL so `new URL()` doesn't crash on relative paths
const absoluteApiUrl = envApiUrl.startsWith('http')
  ? envApiUrl
  : window.location.origin + (envApiUrl.startsWith('/') ? envApiUrl : `/${envApiUrl}`);

// If the env variable already includes /api/v1, use it directly. Otherwise, append it.
export const BASE_URL = absoluteApiUrl.endsWith('/api/v1') 
  ? absoluteApiUrl 
  : `${absoluteApiUrl}/api/v1`

// For endpoints that don't need /api/v1 prefix
export const API_ROOT = absoluteApiUrl.endsWith('/api/v1') 
  ? absoluteApiUrl.replace(/\/api\/v1$/, '') 
  : absoluteApiUrl
