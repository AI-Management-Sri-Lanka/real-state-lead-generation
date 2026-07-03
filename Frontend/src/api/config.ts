// Centralized API configuration
// Ensures consistent BASE_URL across all API calls

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// Always append /api/v1 to the base URL for consistency
export const BASE_URL = `${API_BASE}/api/v1`

// For endpoints that don't need /api/v1 prefix
export const API_ROOT = API_BASE
