// src/pages/auth/components/GoogleButton.tsx
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { Button } from '@/components/ui/Button'

const GIcon = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2A10.3 10.3 0 0 0 17.52 8H9v3.38h4.84A4.14 4.14 0 0 1 12.08 14v2.34h2.88C16.66 14.6 17.64 12.11 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.88-2.23A5.6 5.6 0 0 1 3.64 10H.77v2.3C2.22 16.1 5.39 18 9 18z" fill="#34A853"/>
    <path d="M3.64 10a5.6 5.6 0 0 1 0-3.6V4.1H.77a9 9 0 0 0 0 8.1L3.64 10z" fill="#FBBC05"/>
    <path d="M9 3.58c1.32 0 2.5.45 3.44 1.34L14.96 2.4C13.46.99 11.42.18 9 .18 5.39.18 2.22 2.09.77 5L3.64 7.3A5.38 5.38 0 0 1 9 3.58z" fill="#EA4335"/>
  </svg>
)

interface GoogleButtonProps {
  /** Used only for the fallback (unconfigured) button text, and to pick
   * "signup_with" vs "continue_with" copy on Google's own button. */
  label?: string
  /** Called with the verified Google ID token (JWT) once the user picks an
   * account. Pass this straight to `authApi.googleAuth` / `googleSignIn`. */
  onSuccess: (idToken: string) => void
  onError?: () => void
  disabled?: boolean
}

export function GoogleButton({ label = 'Continue with Google', onSuccess, onError, disabled }: GoogleButtonProps) {
  const clientIdConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  // No client ID set up yet -> show a disabled look-alike instead of a
  // button that would silently fail when clicked.
  if (!clientIdConfigured) {
    return (
      <Button
        type="button"
        variant="secondary"
        fullWidth
        size="lg"
        icon={GIcon}
        disabled
        title="Google sign-in isn't configured yet (set VITE_GOOGLE_CLIENT_ID)"
      >
        {label}
      </Button>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <GoogleLogin
        theme="outline"
        shape="pill"
        size="large"
        text={label.toLowerCase().includes('sign up') ? 'signup_with' : 'continue_with'}
        onSuccess={(credentialResponse: CredentialResponse) => {
          if (credentialResponse.credential) {
            onSuccess(credentialResponse.credential)
          } else {
            onError?.()
          }
        }}
        onError={() => onError?.()}
      />
    </div>
  )
}