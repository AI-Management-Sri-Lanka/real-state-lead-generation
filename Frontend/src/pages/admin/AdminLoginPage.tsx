/**
 * AdminLoginPage — Master Admin sign-in
 * Route: /admin/login
 * Stores admin JWT in localStorage under 'aimsl_admin_token'
 *
 * Reuses the same AuthBrandPanel / AuthFormShell / Input / Button building
 * blocks as the main Sign-In page (see SignInPage.tsx) so this page stays
 * visually consistent with the rest of the auth flow, with admin-specific
 * copy and a restricted-access notice layered on top.
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { BASE_URL } from '@/api/config'
import { AuthBrandPanel } from '@/pages/auth/components/AuthBrandPanel'
import { AuthFormShell }  from '@/pages/auth/components/AuthFormShell'
import { Input }          from '@/components/ui/Input'
import { Button }         from '@/components/ui/Button'

const HEADING = (
  <>Control and manage your <span style={{ color:'#00C896', fontStyle:'italic' }}>platform operations</span> with master admin tools.</>
)

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body?.error?.message ?? body?.message ?? 'Login failed')
      }
      const token = body?.data?.access_token
      const refresh_token = body?.data?.refresh_token
      const admin = body?.data?.admin
      if (!token) throw new Error('No token in response')

      localStorage.setItem('aimsl_admin_token', token)
      if (refresh_token) {
        localStorage.setItem('aimsl_admin_refresh_token', refresh_token)
      }
      localStorage.setItem('aimsl_admin', JSON.stringify(admin))
      navigate('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <AuthBrandPanel
        logoSuffix="ADMIN"
        heading={HEADING}
        subheading="Configure system settings, monitor performance, and manage all user access."
        bullets={['Centralized platform control panel', 'Granular user and role management']}
      />

      <AuthFormShell width={480}>
        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <p style={{ fontSize:12, fontWeight:600, color:'var(--color-brand)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Welcome back</p>
          <h2 style={{ fontSize:30, fontWeight:800, color:'var(--color-text-heading)', letterSpacing:'-0.03em', marginBottom:8 }}>Sign in to Admin Portal.</h2>
          <p style={{ fontSize:14, color:'var(--color-text-secondary)' }}>Enter your credentials to access the master control panel.</p>
        </div>

        {/* Restricted access notice */}
        <div style={{
          display:'flex', alignItems:'center', gap:10, marginBottom:24,
          padding:'11px 14px', borderRadius:'var(--radius-md)',
          background:'rgba(61,59,243,0.06)', border:'1px solid rgba(61,59,243,0.18)',
        }}>
          <ShieldCheck size={16} style={{ flexShrink:0, color:'var(--color-brand)' }} />
          <p style={{ fontSize:12.5, color:'var(--color-text-secondary)', lineHeight:1.5 }}>
            Restricted access — authorized administrators only
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Input
            label="Email" name="email" type="email" placeholder="admin@domain.com"
            autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
          />

          <Input
            label="Password" name="password" type="password" placeholder="••••••••"
            autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
          />

          {error && (
            <p style={{
              fontSize:13, color:'var(--color-error)', background:'rgba(239,68,68,0.08)',
              border:'1px solid rgba(239,68,68,0.25)', borderRadius:'var(--radius-md)', padding:'10px 12px',
            }}>
              {error}
            </p>
          )}

          <Button
            type="submit" fullWidth size="lg" loading={loading}
            iconRight={!loading ? <ArrowRight size={17}/> : undefined}
            style={{ marginTop:4, height:54, fontSize:16, fontWeight:700, borderRadius:12, color:'#fff' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p style={{ textAlign:'center', marginTop:24, fontSize:14, color:'var(--color-text-secondary)' }}>
          <Link to="/" style={{ color:'var(--color-brand)', fontWeight:600, textDecoration:'none' }}>← Back to site</Link>
        </p>
      </AuthFormShell>
    </div>
  )
}