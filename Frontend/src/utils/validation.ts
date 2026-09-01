// Shared validation utilities
// Enforce lowercase-only email addresses (local and domain) per app requirement.
// Example: name@example.com
export const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/

export function isValidEmail(value: string | undefined | null): boolean {
  if (!value) return false
  const v = value.trim()
  // Quick reject if any uppercase letters present
  if (/[A-Z]/.test(v)) return false
  return EMAIL_REGEX.test(v)
}

export default { isValidEmail }
