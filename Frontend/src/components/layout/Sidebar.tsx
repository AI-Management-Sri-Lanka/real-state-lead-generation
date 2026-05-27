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

      <div className="mt-auto rounded-[28px] border border-slate-800/90 bg-slate-900/95 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name ?? 'User'} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.name ?? 'User'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email ?? 'hello@leadai.com'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

Sidebar.propTypes = {}
