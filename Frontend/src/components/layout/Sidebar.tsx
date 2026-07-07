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
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="flex h-full min-h-full w-[260px] flex-col overflow-y-auto border-r border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] px-4 py-6 text-slate-100 dark:border-sky-800/40 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)]">
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
                    ? 'border-l-4 border-sky-500 bg-gradient-to-r from-sky-500/15 to-indigo-500/15 text-sky-700 dark:text-sky-300'
                    : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-slate-200'
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
                    ? 'border-l-4 border-sky-500 bg-gradient-to-r from-sky-500/15 to-indigo-500/15 text-sky-700 dark:text-sky-300'
                    : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-slate-200'
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
            className="flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-slate-200"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-auto rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] p-4 shadow-[0_10px_30px_rgba(14,116,144,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_10px_30px_rgba(2,6,23,0.28)]">
        <div className="flex items-center gap-3">
          <Avatar name={user?.full_name ?? 'User'} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.full_name ?? 'User'}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email ?? 'hello@leadai.com'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

Sidebar.propTypes = {}
