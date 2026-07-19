// src/components/layout/Sidebar.tsx
import PropTypes from 'prop-types'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, History, Settings, LogOut, Home, ChevronsLeft, ChevronsRight, MessageSquare } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { useSidebar } from '@/contexts/SidebarContext'

const MAIN_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/ai-assistant', icon: History, label: 'AI Chat' },
  { to: '/dashboard/properties', icon: Home, label: 'My Properties' },
  { to: '/dashboard/requests', icon: MessageSquare, label: 'Requests' },
]
const ACCOUNT_NAV = [
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { collapsed, toggleCollapsed } = useSidebar()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-3 rounded-3xl py-3 text-sm font-medium transition-all duration-200 ${
      collapsed ? 'justify-center px-3' : 'px-4'
    } ${
      isActive
        ? 'border-l-4 border-sky-500 bg-gradient-to-r from-sky-500/15 to-indigo-500/15 text-sky-700 dark:text-sky-300'
        : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-slate-200'
    }`

  return (
    <aside className="relative flex h-full min-h-full w-full flex-col overflow-y-auto overflow-x-hidden border-r border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] px-4 py-6 text-slate-100 dark:border-sky-800/40 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)]">
      {/* Collapse / expand toggle — desktop only, mobile uses the backdrop/close in DashboardLayout */}
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-8 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-sky-200 bg-white text-slate-500 shadow-[0_4px_12px_rgba(14,116,144,0.15)] transition hover:text-sky-600 dark:border-sky-800/40 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-sky-300 lg:flex"
      >
        {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
      </button>

      <div className="mb-8 px-2">
        {!collapsed && (
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Main</p>
        )}
        <div className="mt-4 space-y-2">
          {MAIN_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={navLinkClass}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mb-6 px-2">
        {!collapsed && (
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Account</p>
        )}
        <div className="mt-4 space-y-2">
          {ACCOUNT_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={navLinkClass}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              signOut()
              navigate('/auth/signin')
            }}
            title={collapsed ? 'Sign out' : undefined}
            className={`flex w-full items-center gap-3 rounded-3xl py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-slate-200 ${
              collapsed ? 'justify-center px-3' : 'px-4'
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </div>

      <div
        className={`mt-auto rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] shadow-[0_10px_30px_rgba(14,116,144,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_10px_30px_rgba(2,6,23,0.28)] ${
          collapsed ? 'p-2' : 'p-4'
        }`}
      >
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar name={user?.full_name ?? 'User'} size={44} />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.full_name ?? 'User'}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email ?? 'hello@leadai.com'}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

Sidebar.propTypes = {}