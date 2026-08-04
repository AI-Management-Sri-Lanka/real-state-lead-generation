/**
 * AdminLoginPage — Master Admin sign-in
 * Route: /admin/login
 * Stores admin JWT in localStorage under 'aimsl_admin_token'
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { BASE_URL } from '@/api/config'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/40">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">LeadAI Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Master Admin Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/60">
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-900/60 bg-indigo-950/30 px-3 py-2.5">
            <ShieldCheck size={16} className="shrink-0 text-indigo-400" />
            <p className="text-xs text-indigo-300">Restricted access — authorised administrators only</p>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@domain.com"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 pr-10 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign in'}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          <a href="/" className="hover:text-slate-400 transition">← Back to site</a>
        </p>
      </div>
    </div>
  )
}
