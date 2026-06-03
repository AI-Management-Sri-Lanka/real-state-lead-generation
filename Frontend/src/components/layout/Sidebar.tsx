// src/components/layout/Sidebar.tsx
import PropTypes from 'prop-types'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Settings, LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'

const MAIN_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/ai-assistant', icon: MessageSquare, label: 'AI Chat' },
]
const ACCOUNT_NAV = [
  { to: '/dashboard/profile', icon: Settings, label: 'Profile' },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName =
    user?.full_name?.trim() || user?.name?.trim() || user?.email?.split('@')[0] || 'User'
  const displayEmail =
    user?.email ??
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
      } catch {
        return null
      }
      return null
    })() ??
    'hello@leadai.com'

  return (
    <aside className="flex h-full min-h-full w-[260px] flex-col overflow-y-auto border-r border-slate-800/80 bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mb-8 px-2">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Main</p>
        <div className="mt-4 space-y-2">
          {MAIN_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'border-l-4 border-brand bg-slate-900 text-brand'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mb-6 px-2">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Account</p>
        <div className="mt-4 space-y-2">
          {ACCOUNT_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'border-l-4 border-brand bg-slate-900 text-brand'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
                signOut()
                navigate('/auth/signin')
              }}
            className="flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/dashboard/profile')}
        className="mt-auto w-full rounded-[28px] border border-slate-800/90 bg-slate-900/95 p-4 text-left transition hover:border-brand"
      >
        <div className="flex items-center gap-3">
          <Avatar name={displayName} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{displayEmail}</p>
          </div>
        </div>
      </button>
    </aside>
  )
}

Sidebar.propTypes = {}
