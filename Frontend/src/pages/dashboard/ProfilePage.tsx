// src/pages/dashboard/ProfilePage.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <DashboardLayout activeNav="Profile">
        <div className="w-full px-4 py-10 text-slate-100 sm:px-6 md:px-8 lg:px-10">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800/80 bg-slate-950/90 p-8 text-center">
            <p className="text-sm text-slate-400">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Support both {full_name} and {name} shapes, and fall back to email username if needed
  const displayName =
    user.full_name?.trim() || user.name?.trim() || user.email?.split('@')[0] || 'User'

  // Try every known key where email might live
  const displayEmail =
    user.email ??
    (user as any)?.username ??
    (() => {
      try {
        const keys = ['aimsl_user', 'user', 'auth_user', 'currentUser']
        for (const key of keys) {
          const raw = localStorage.getItem(key)
          if (!raw) continue
          const parsed = JSON.parse(raw)
          const found = parsed?.email ?? parsed?.username ?? null
          if (found) return found
        }
      } catch {}
      return null
    })() ??
    '—'

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  const accountStatus = user.is_active !== false ? 'Active' : 'Inactive'
  const statusClasses = user.is_active !== false ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
  const [activeTab, setActiveTab] = useState<'overview' | 'security'>('overview')

  return (
    <DashboardLayout activeNav="Profile">
      <div className="w-full px-4 py-10 text-slate-100 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">

          <div className="mb-10 flex flex-col gap-4 rounded-[28px] border border-slate-800/80 bg-slate-950/90 p-8 shadow-2xl sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-brand/70">Profile</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Your personal dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                Review your account details, access settings, and keep your profile up to date.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboard/profile/edit"
                className="inline-flex items-center justify-center rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow hover:opacity-95"
              >
                Edit profile
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-3xl border border-slate-700 bg-slate-900/90 px-5 py-3 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
              >
                Dashboard home
              </Link>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 rounded-[28px] border border-slate-800/80 bg-slate-950/90 p-4 shadow-inner sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-3xl bg-slate-900/80 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`rounded-3xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'overview' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`rounded-3xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === 'security' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Security
              </button>
            </div>
            <p className="text-sm text-slate-400">Switch tabs to view your account summary or security status.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.8fr_1.2fr]">
            <div className="rounded-[32px] border border-slate-800/80 bg-gradient-to-br from-slate-900/90 to-slate-950/95 p-8 shadow-2xl">
              <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-5">
                  <Avatar name={displayName} size={96} />
                  <div>
                    <p className="text-sm uppercase tracking-[0.32em] text-emerald-300/80">Welcome back</p>
                    <h2 className="mt-2 text-4xl font-semibold text-white">{displayName}</h2>
                    <p className="mt-2 text-sm text-slate-300">{displayEmail}</p>
                  </div>
                </div>
                <div className={`rounded-3xl px-4 py-3 text-sm font-medium ${statusClasses}`}>
                  Account is <span className="font-semibold">{accountStatus}</span>
                </div>
              </div>

              <div className="mt-10">
                {activeTab === 'overview' ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Member since</p>
                      <p className="mt-3 text-xl font-semibold text-white">{memberSince}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Email</p>
                      <p className="mt-3 text-xl font-semibold text-white truncate">{displayEmail}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">User ID</p>
                      <p className="mt-3 text-xl font-semibold text-white truncate">{user.id ?? '—'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Security level</p>
                      <p className="mt-3 text-xl font-semibold text-white">Strong</p>
                      <p className="mt-2 text-sm text-slate-400">Use a strong password and keep your email secure.</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Verification</p>
                      <p className="mt-3 text-xl font-semibold text-white">Two-step ready</p>
                      <p className="mt-2 text-sm text-slate-400">Enable two-factor authentication in your account settings.</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-5 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Recent activity</p>
                      <p className="mt-3 text-base text-slate-300">Last signed in from your current device. Monitor account access for new sessions.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-800/80 bg-slate-950/90 p-8 shadow-xl">
                <h3 className="text-lg font-semibold text-white">Profile details</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Your profile information is stored securely. Use the edit page to keep your contact details current.
                </p>
                <dl className="mt-6 space-y-4 text-sm text-slate-300">
                  <div className="flex justify-between gap-4 rounded-3xl bg-slate-900/80 px-4 py-4">
                    <span>Name</span>
                    <span className="font-semibold text-white">{displayName}</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-3xl bg-slate-900/80 px-4 py-4">
                    <span>Email</span>
                    <span className="font-semibold text-white truncate">{displayEmail}</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-3xl bg-slate-900/80 px-4 py-4">
                    <span>Status</span>
                    <span className={`font-semibold ${user.is_active !== false ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {accountStatus}
                    </span>
                  </div>
                </dl>
              </div>
              <div className="rounded-[28px] border border-slate-800/80 bg-slate-950/90 p-8 shadow-xl">
                <h3 className="text-lg font-semibold text-white">Need help?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  If you need to update other account settings like password recovery, visit the security section or contact support.
                </p>
                <div className="mt-6">
                  <Link
                    to="/dashboard/profile/edit"
                    className="inline-flex items-center justify-center rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow hover:opacity-95"
                  >
                    Update profile details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}