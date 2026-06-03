// // src/pages/auth/components/GoogleButton.tsx
// import { useEffect, useRef, useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { Button } from '@/components/ui/Button'
// import { useAuth } from '@/hooks/useAuth'
// import toast from 'react-hot-toast'

// const GIcon = (
//   <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
//     <path d="M17.64 9.2A10.3 10.3 0 0 0 17.52 8H9v3.38h4.84A4.14 4.14 0 0 1 12.08 14v2.34h2.88C16.66 14.6 17.64 12.11 17.64 9.2z" fill="#4285F4"/>
//     <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.88-2.23A5.6 5.6 0 0 1 3.64 10H.77v2.3C2.22 16.1 5.39 18 9 18z" fill="#34A853"/>
//     <path d="M3.64 10a5.6 5.6 0 0 1 0-3.6V4.1H.77a9 9 0 0 0 0 8.1L3.64 10z" fill="#FBBC05"/>
//     <path d="M9 3.58c1.32 0 2.5.45 3.44 1.34L14.96 2.4C13.46.99 11.42.18 9 .18 5.39.18 2.22 2.09.77 5L3.64 7.3A5.38 5.38 0 0 1 9 3.58z" fill="#EA4335"/>
//   </svg>
// )

// declare global {
//   interface Window {
//     google?: any
//   }
// }

// const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '808501137296-2qhpes73jl8v1b00kh2gt38sj7go4c6r.apps.googleusercontent.com'

// interface GoogleButtonProps { label?: string; onClick?: () => void }
// export function GoogleButton({ label='Continue with Google', onClick: onClickProp }: GoogleButtonProps) {
//   const navigate = useNavigate()
//   const auth = useAuth()
//   const [sdkReady, setSdkReady] = useState(false)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const initialized = useRef(false)

//   useEffect(() => {
//     if (!GOOGLE_CLIENT_ID) {
//       setError('Google client ID is not configured.')
//       return
//     }

//     const handleLoad = () => {
//       const google = window.google
//       if (!google?.accounts?.id) {
//         setError('Google Identity Services failed to load.')
//         return
//       }

//       if (initialized.current) {
//         setSdkReady(true)
//         return
//       }

//       google.accounts.id.initialize({
//         client_id: GOOGLE_CLIENT_ID,
//         callback: async (response: any) => {
//           if (!response?.credential) {
//             setError('Google sign-in failed to return credentials.')
//             return
//           }
//           setLoading(true)
//           setError(null)
//           try {
//             await auth.googleSignIn(response.credential)
//             toast.success('Signed in with Google')
//             navigate('/dashboard/ai-assistant')
//           } catch (err) {
//             const message = err instanceof Error ? err.message : 'Google sign-in failed'
//             setError(message)
//           } finally {
//             setLoading(false)
//           }
//         },
//         ux_mode: 'popup',
//       })

//       initialized.current = true
//       setSdkReady(true)
//     }

//     if (window.google?.accounts?.id) {
//       handleLoad()
//       return
//     }

//     const script = document.createElement('script')
//     script.src = 'https://accounts.google.com/gsi/client'
//     script.async = true
//     script.defer = true
//     script.onload = handleLoad
//     script.onerror = () => setError('Failed to load Google authentication script.')
//     document.head.appendChild(script)

//     return () => {
//       document.head.removeChild(script)
//     }
//   }, [auth, navigate])

//   const handleClick = () => {
//     if (onClickProp) return onClickProp()
//     if (!sdkReady) {
//       setError('Google sign-in is still loading. Please wait a moment.')
//       return
//     }
//     setError(null)
//     if (window.google?.accounts?.id) {
//       window.google.accounts.id.prompt()
//     } else {
//       setError('Google sign-in is not available.')
//     }
//   }

//   return (
//     <div style={{ width: '100%' }}>
//       <Button
//         variant="secondary"
//         fullWidth
//         size="lg"
//         icon={GIcon}
//         onClick={handleClick}
//         disabled={loading}
//         style={{ opacity: loading ? 0.6 : 1 }}
//       >
//         {label}
//       </Button>
//       {error && <p style={{ marginTop: 10, color: 'var(--color-error)', fontSize: 13 }}>{error}</p>}
//     </div>
//   )
// }
// src/pages/auth/components/GoogleButton.tsx
// src/pages/auth/components/GoogleButton.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

declare global { interface Window { google?: any } }

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  '808501137296-2qhpes73jl8v1b00kh2gt38sj7go4c6r.apps.googleusercontent.com'

interface GoogleButtonProps { label?: string }

export function GoogleButton({ label = 'Continue with Google' }: GoogleButtonProps) {
  const navigate          = useNavigate()
  const { googleSignIn }  = useAuth()
  const buttonRef         = useRef<HTMLDivElement>(null)
  const initializedRef    = useRef(false)
  const callbackRef       = useRef<(response: any) => void>()   // ← always up-to-date callback
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Keep callbackRef current on every render — no stale closure problem
  callbackRef.current = async (response: any) => {
    if (!response?.credential) { setError('Google sign-in failed to return credentials.'); return }
    setLoading(true)
    setError(null)
    try {
      await googleSignIn(response.credential)
      toast.success('Signed in with Google!')
      navigate('/dashboard/ai-assistant')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initGoogle = () => {
      const google = window.google
      if (!google?.accounts?.id || initializedRef.current) return

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        // Delegate to the ref so we always call the latest version
        callback: (response: any) => callbackRef.current?.(response),
        ux_mode: 'popup',
      })

      if (buttonRef.current) {
        google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: buttonRef.current.offsetWidth || 400,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        })
      }

      initializedRef.current = true
    }

    if (window.google?.accounts?.id) { initGoogle(); return }

    const script = document.createElement('script')
    script.src     = 'https://accounts.google.com/gsi/client'
    script.async   = true
    script.defer   = true
    script.onload  = initGoogle
    script.onerror = () => setError('Failed to load Google sign-in script.')
    document.head.appendChild(script)

    return () => { if (document.head.contains(script)) document.head.removeChild(script) }
  }, [])  // runs once — callbackRef handles freshness

  return (
    <div style={{ width: '100%' }}>
      {loading && (
        <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--color-border)', borderRadius: 8,
          fontSize: 14, color: 'var(--color-text-secondary)', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2A10.3 10.3 0 0 0 17.52 8H9v3.38h4.84A4.14 4.14 0 0 1 12.08 14v2.34h2.88C16.66 14.6 17.64 12.11 17.64 9.2z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.88-2.23A5.6 5.6 0 0 1 3.64 10H.77v2.3C2.22 16.1 5.39 18 9 18z" fill="#34A853"/>
            <path d="M3.64 10a5.6 5.6 0 0 1 0-3.6V4.1H.77a9 9 0 0 0 0 8.1L3.64 10z" fill="#FBBC05"/>
            <path d="M9 3.58c1.32 0 2.5.45 3.44 1.34L14.96 2.4C13.46.99 11.42.18 9 .18 5.39.18 2.22 2.09.77 5L3.64 7.3A5.38 5.38 0 0 1 9 3.58z" fill="#EA4335"/>
          </svg>
          Signing in…
        </div>
      )}
      <div ref={buttonRef} style={{ width: '100%', display: loading ? 'none' : 'block', minHeight: 44 }} />
      {error && <p style={{ marginTop: 8, color: 'var(--color-error)', fontSize: 13 }}>{error}</p>}
    </div>
  )
}