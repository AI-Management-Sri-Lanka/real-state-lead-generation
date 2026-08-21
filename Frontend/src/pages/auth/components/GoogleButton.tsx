// src/pages/auth/components/GoogleButton.tsx
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
const GIcon = (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2A10.3 10.3 0 0 0 17.52 8H9v3.38h4.84A4.14 4.14 0 0 1 12.08 14v2.34h2.88C16.66 14.6 17.64 12.11 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.88-2.23A5.6 5.6 0 0 1 3.64 10H.77v2.3C2.22 16.1 5.39 18 9 18z" fill="#34A853"/>
    <path d="M3.64 10a5.6 5.6 0 0 1 0-3.6V4.1H.77a9 9 0 0 0 0 8.1L3.64 10z" fill="#FBBC05"/>
    <path d="M9 3.58c1.32 0 2.5.45 3.44 1.34L14.96 2.4C13.46.99 11.42.18 9 .18 5.39.18 2.22 2.09.77 5L3.64 7.3A5.38 5.38 0 0 1 9 3.58z" fill="#EA4335"/>
  </svg>
)
interface GoogleButtonProps { label?: string }
export function GoogleButton({ label='Continue with Google' }: GoogleButtonProps) {
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleClick = useCallback(async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Welcome!')
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Google sign-in failed', { id: 'google-signin-error' })
    } finally {
      setLoading(false)
    }
  }, [signInWithGoogle, navigate])

  return <Button variant="secondary" fullWidth size="lg" icon={GIcon} onClick={handleClick} loading={loading}>{label}</Button>
}
