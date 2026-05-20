// src/pages/auth/components/SignInForm.tsx
import { FormEvent, useState } from 'react'
import { Link, useNavigate }   from 'react-router-dom'
import { ArrowRight }          from 'lucide-react'
import toast                    from 'react-hot-toast'
import { Input }                from '@/components/ui/Input'
import { Button }               from '@/components/ui/Button'
import { useAuth }              from '@/hooks/useAuth'
import { useForm }              from '@/hooks/useForm'
import { GoogleButton }         from './GoogleButton'
import { AuthDivider }          from './AuthDivider'

const INIT = { email:'', password:'' }
function validate(v: typeof INIT) {
  const e: Partial<typeof INIT> = {}
  if (!v.email) e.email='Email is required'
  else if (!/\S+@\S+\.\S+/.test(v.email)) e.email='Enter a valid email'
  if (!v.password) e.password='Password is required'
  else if (v.password.length<6) e.password='At least 6 characters'
  return e
}

export function SignInForm() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [loading, setLoading] = useState(false)
  const form = useForm(INIT, validate)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.validate()) return
    setLoading(true)
    try { await signIn(form.values.email, form.values.password); toast.success('Welcome back!'); navigate('/dashboard/ai-assistant') }
    catch (err: unknown) { toast.error((err as Error).message ?? 'Sign in failed') }
    finally { setLoading(false) }
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:12, fontWeight:600, color:'var(--color-brand)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Welcome back</p>
        <h2 style={{ fontSize:30, fontWeight:800, color:'var(--color-text-heading)', letterSpacing:'-0.03em', marginBottom:8 }}>Sign in to LeadAI</h2>
        <p style={{ fontSize:14, color:'var(--color-text-secondary)' }}>Enter your credentials to access your dashboard.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Input label="Email address" name="email" type="email" placeholder="you@example.com"
          autoComplete="email" value={form.values.email} onChange={form.handleChange} onBlur={form.handleBlur}
          error={form.touched.email ? form.errors.email : undefined} />

        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <label style={{ fontSize:13, fontWeight:500, color:'var(--color-text-primary)' }}>Password</label>
            <a href="#" style={{ fontSize:13, color:'var(--color-brand)', textDecoration:'none', fontWeight:500 }}>Forgot password?</a>
          </div>
          <Input name="password" type="password" placeholder="Your password"
            autoComplete="current-password" value={form.values.password} onChange={form.handleChange} onBlur={form.handleBlur}
            error={form.touched.password ? form.errors.password : undefined} />
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading} iconRight={!loading ? <ArrowRight size={17}/> : undefined} style={{ marginTop:4, height:54, fontSize:16, fontWeight:700, borderRadius:12 }}>
          <Link to="/dashboard/ai-assistant">{loading ? 'Signing in…' : 'Sign in'}</Link>
        </Button>
      </form>

      <AuthDivider label="or continue with" />
      <GoogleButton />

      <p style={{ textAlign:'center', marginTop:24, fontSize:14, color:'var(--color-text-secondary)' }}>
        Don't have an account?{' '}
        <Link to="/signup" style={{ color:'var(--color-brand)', fontWeight:600, textDecoration:'none' }}>Create one</Link>
      </p>
    </>
  )
}
