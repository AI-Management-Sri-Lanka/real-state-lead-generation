import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from '@/hooks/useForm'

type ProfileFormValues = {
  full_name: string
  email: string
  password: string
} & Record<string, string>

function profileValidator(values: ProfileFormValues) {
  const errors: Partial<Record<keyof ProfileFormValues, string>> = {}

  if (!values.full_name.trim()) {
    errors.full_name = 'Full name is required.'
  }

  if (!values.email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (values.password && values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  return errors
}

function getPasswordStrength(password: string) {
  if (!password) {
    return { label: 'No password', color: 'text-slate-400' }
  }

  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score >= 4) {
    return { label: 'Strong', color: 'text-emerald-300' }
  }
  if (score >= 3) {
    return { label: 'Medium', color: 'text-amber-300' }
  }
  return { label: 'Weak', color: 'text-rose-300' }
}

export default function ProfileEditPage() {
  const { user, updateProfile, isLoading } = useAuth()
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { values, errors, touched, handleChange, handleBlur, validate, reset, setValues } = useForm<ProfileFormValues>(
    {
      full_name: user?.full_name ?? '',
      email: user?.email ?? '',
      password: '',
    },
    profileValidator,
  )

  useEffect(() => {
    if (!user) return
    setValues({ full_name: user.full_name, email: user.email, password: '' })
  }, [user, setValues])

  const previewName = values.full_name.trim() || user.full_name || 'User'
  const previewEmail = values.email.trim() || user.email || 'hello@example.com'
  const passwordStrength = getPasswordStrength(values.password)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return

    if (!validate()) {
      setStatus('error')
      setMessage('Please fix the highlighted fields.')
      return
    }

    setStatus('saving')
    setMessage(null)

    try {
      await updateProfile({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        password: values.password.trim() || undefined,
      })
      setStatus('success')
      setMessage('Profile saved successfully.')
      reset()
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Unable to save profile.'
      setStatus('error')
      setMessage(text)
    }
  }

  if (!user) {
    return (
      <DashboardLayout activeNav="Profile">
        <div className="w-full px-4 py-10 text-slate-100 sm:px-6 md:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800/80 bg-slate-950/90 p-8 text-center">
            <p className="text-sm text-slate-400">Loading profile editor...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const joinedDate = new Date(user.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <DashboardLayout activeNav="Profile">
      <div className="w-full px-4 py-10 text-slate-100 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 rounded-[28px] border border-slate-800/80 bg-slate-950/90 p-8 shadow-2xl sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-brand/70">Profile settings</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Edit your account</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Refresh your contact details, keep your email current, and update your password at any time.
              </p>
            </div>
            <Link
              to="/dashboard/profile"
              className="inline-flex items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-5 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            >
              Back to profile
            </Link>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.1fr_1.9fr]">
            <aside className="rounded-[32px] border border-slate-800/80 bg-slate-950/90 p-8 shadow-xl">
              <div className="flex flex-col items-center text-center">
                <Avatar name={previewName} size={96} />
                <h2 className="mt-5 text-2xl font-semibold text-white">{previewName}</h2>
                <p className="mt-2 text-sm text-slate-400 truncate">{previewEmail}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-500">Joined {joinedDate}</p>
              </div>

              <div className="mt-8 space-y-4 rounded-[28px] bg-slate-900/80 p-5">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                  <span>Account status</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_active !== false ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                    {user.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                  <span>Profile saved</span>
                  <span className="font-medium text-white">Live</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                  <span>Secure profile</span>
                  <span className="font-medium text-white">2FA ready</span>
                </div>
              </div>
            </aside>

            <section className="rounded-[32px] border border-slate-800/80 bg-slate-950/90 p-8 shadow-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-brand/70">Personal info</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Update your profile</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    The changes below will be reflected instantly across your account.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                  Password is optional
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-slate-400">Full name</span>
                    <input
                      name="full_name"
                      value={values.full_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    {touched.full_name && errors.full_name && (
                      <p className="mt-2 text-xs text-rose-400">{errors.full_name}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm text-slate-400">Email address</span>
                    <input
                      type="email"
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="mt-3 w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    {touched.email && errors.email && (
                      <p className="mt-2 text-xs text-rose-400">{errors.email}</p>
                    )}
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm text-slate-400">New password</span>
                  <div className="relative mt-3">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Leave blank to keep your current password"
                      className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-3 pr-24 text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                    <span className="text-slate-500">Strength indicator</span>
                  </div>
                  {touched.password && errors.password && (
                    <p className="mt-2 text-xs text-rose-400">{errors.password}</p>
                  )}
                </label>

                {message && (
                  <div className={`rounded-3xl px-4 py-3 text-sm ${status === 'success' ? 'bg-emerald-950/80 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-rose-950/80 text-rose-300 ring-1 ring-rose-500/30'}`}>
                    {message}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">You can update these details anytime.</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        reset()
                        setMessage(null)
                        setStatus('idle')
                      }}
                      className="inline-flex items-center justify-center rounded-3xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
                    >
                      Reset
                    </button>
                    <Link
                      to="/dashboard/profile"
                      className="inline-flex items-center justify-center rounded-3xl border border-slate-700 px-5 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={status === 'saving' || isLoading}
                      className="inline-flex items-center justify-center rounded-3xl bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === 'saving' ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
