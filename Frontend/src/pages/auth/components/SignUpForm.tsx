// src/pages/auth/components/SignUpForm.tsx
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

const INIT = { name:'', email:'', password:'', confirmPassword:'' }
function validate(v: typeof INIT) {
  const e: Partial<typeof INIT> = {}
  if (!v.name) e.name='Full name is required'
  else if (v.name.length<2) e.name='At least 2 characters'
  if (!v.email) e.email='Email is required'
  else if (!/\S+@\S+\.\S+/.test(v.email)) e.email='Enter a valid email'
  if (!v.password) e.password='Password is required'
  else if (v.password.length<8) e.password='At least 8 characters'
  if (!v.confirmPassword) e.confirmPassword='Confirm your password'
  else if (v.confirmPassword!==v.password) e.confirmPassword='Passwords do not match'
  return e
}

export function SignUpForm() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()
  const [loading, setLoading] = useState(false)
  const form = useForm(INIT, validate)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.validate()) return
    setLoading(true)
    try { await signUp(form.values.name, form.values.email, form.values.password); toast.success('Account created! Welcome.'); navigate('/dashboard/ai-assistant') }
    catch (err: unknown) { toast.error((err as Error).message ?? 'Sign up failed') }
    finally { setLoading(false) }
  }

  return (
    <>
      <div style={{ marginBottom:32 }}>
        {/* <h2 style={{ fontSize:30, fontWeight:800, color:'var(--color-text-heading)', letterSpacing:'-0.03em', marginBottom:8 }}>Create your account</h2> */}
        <p style={{ fontSize:14, color:'var(--color-text-secondary)' }}>Start finding real estate buyers with AI today.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Input label="Full name" name="name" type="text" placeholder="Kamal Silva" autoComplete="name"
          value={form.values.name} onChange={form.handleChange} onBlur={form.handleBlur}
          error={form.touched.name ? form.errors.name : undefined} />
        <Input label="Email address" name="email" type="email" placeholder="you@example.com" autoComplete="email"
          value={form.values.email} onChange={form.handleChange} onBlur={form.handleBlur}
          error={form.touched.email ? form.errors.email : undefined} />
        <Input label="Password" name="password" type="password" placeholder="Min. 8 characters" autoComplete="new-password"
          value={form.values.password} onChange={form.handleChange} onBlur={form.handleBlur}
          error={form.touched.password ? form.errors.password : undefined}
          hint="Use letters, numbers and symbols" />
        <Input label="Confirm password" name="confirmPassword" type="password" placeholder="Repeat your password" autoComplete="new-password"
          value={form.values.confirmPassword} onChange={form.handleChange} onBlur={form.handleBlur}
          error={form.touched.confirmPassword ? form.errors.confirmPassword : undefined} />
        <Button type="submit" fullWidth size="lg" loading={loading} iconRight={!loading ? <ArrowRight size={17}/> : undefined} style={{ marginTop:6, height:54, fontSize:16, fontWeight:700, borderRadius:12 }}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <AuthDivider label="or" />
      <GoogleButton label="Sign up with Google" />
      <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'var(--color-text-secondary)' }}>
        Already have an account?{' '}
        <Link to="/auth/signin" style={{ color:'var(--color-brand)', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
      </p>
    </>
  )
}
