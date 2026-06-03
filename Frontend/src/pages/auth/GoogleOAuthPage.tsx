import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    google?: any
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '808501137296-2qhpes73jl8v1b00kh2gt38sj7go4c6r.apps.googleusercontent.com'

export default function GoogleOAuthPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const buttonContainer = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google client ID is not configured.')
      return
    }

    const initGoogle = () => {
      const google = window.google
      if (!google?.accounts?.id) {
        setError('Google Identity Services failed to load.')
        return
      }

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        ux_mode: 'popup',
      })

      if (buttonContainer.current) {
        google.accounts.id.renderButton(buttonContainer.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: '100%',
        })
      }

      setSdkReady(true)
    }

    if (window.google?.accounts?.id) {
      initGoogle()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGoogle
    script.onerror = () => setError('Failed to load Google authentication script.')
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  async function handleCredentialResponse(response: any) {
    if (!response?.credential) {
      setError('Google sign-in failed to return credentials.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await auth.googleSignIn(response.credential)
      toast.success('Signed in with Google')
      navigate('/dashboard/ai-assistant')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 560, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--color-text-heading)' }}>Continue with Google</h2>
        <p style={{ marginBottom: 18, color: 'var(--color-text-secondary)' }}>
          Sign in with your Google account. If the button does not render, use the fallback button below.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div ref={buttonContainer} />

          {!sdkReady && (
            <Button variant="secondary" fullWidth size="lg" onClick={() => window.google?.accounts?.id?.prompt() ?? setError('Google SDK is still loading')}>
              Load Google sign-in
            </Button>
          )}

          <Button variant="ghost" fullWidth size="lg" onClick={() => navigate('/auth/signin')} disabled={loading}>
            Back to Sign in
          </Button>

          {error && <div style={{ color: 'var(--color-error)', fontSize: 14 }}>{error}</div>}
        </div>
      </div>
    </div>
  )
}
