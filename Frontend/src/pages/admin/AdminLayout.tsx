// src/pages/admin/AdminLayout.tsx
// Shared sidebar + topbar shell for all Master Admin pages
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, MessageSquare, Shield,
  LogOut, Menu, X, ChevronRight, Bell, Star
} from 'lucide-react'
import { BackToTopButton } from '@/components/ui/BackToTopButton'
import { adminAuthApi } from '@/api/adminApi'

const NAV_ITEMS = [
  { to: '/admin/dashboard',   icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/admin/properties',  icon: Building2,        label: 'Properties'  },
  { to: '/admin/users',       icon: Users,            label: 'Users'       },
  { to: '/admin/sessions',    icon: MessageSquare,    label: 'Sessions'    },
  { to: '/admin/inquiries',   icon: Star,             label: 'Inquiries'   },
  { to: '/admin/manage',      icon: Shield,           label: 'Admins'      },
]

// Tailwind's `md` breakpoint (768px) — below this we treat the sidebar as an
// off-canvas mobile drawer instead of a collapsible desktop rail.
const MOBILE_BREAKPOINT = 768

export default function AdminLayout() {
  const navigate = useNavigate()
  // On desktop this means "expanded rail" (vs icon-only). On mobile this means
  // "drawer open" (vs fully hidden off-canvas). Defaults to open on desktop,
  // closed on mobile so the drawer never covers the screen on first load.
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= MOBILE_BREAKPOINT
  )
  const mainRef = useRef<HTMLElement>(null)
  const admin = (() => {
    try { return JSON.parse(localStorage.getItem('aimsl_admin') ?? '{}') }
    catch { return {} }
  })()

  // Keep the sidebar state sane across resizes (e.g. rotating a tablet, or
  // resizing a desktop browser window down past the breakpoint).
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= MOBILE_BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT) {
      setSidebarOpen(false)
    }
  }

  const handleLogout = async () => {
    await adminAuthApi.logout()
    localStorage.removeItem('aimsl_admin_token')
    localStorage.removeItem('aimsl_admin_refresh_token')
    localStorage.removeItem('aimsl_admin')
    navigate('/admin/login', { replace: true })
  }

  const initials = admin?.full_name
    ? admin.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">

      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm md:hidden"
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-shrink-0 flex-col border-r border-slate-800/80 bg-slate-900
          shadow-2xl transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:static md:z-0 md:shadow-none md:transition-[width] md:duration-300 md:translate-x-0
          ${sidebarOpen ? 'md:w-56' : 'md:w-16'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/80">
          <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-900/50">
            <Shield size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-none">LeadAI</p>
              <p className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase mt-0.5">Admin</p>
            </div>
          )}
          {/* Close button, mobile-only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeOnMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${isActive
                  ? 'bg-indigo-600/20 text-indigo-300 shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {sidebarOpen && <span className="truncate">{label}</span>}
                  {sidebarOpen && isActive && <ChevronRight size={14} className="ml-auto text-indigo-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Admin profile at bottom */}
        <div className="border-t border-slate-800/80 p-3">
          <div className={`flex items-center gap-3 rounded-xl p-2 ${sidebarOpen ? 'bg-slate-800/50' : ''}`}>
            <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
              {initials}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{admin?.full_name ?? 'Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{admin?.email ?? ''}</p>
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                title="Logout"
                className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between gap-2 px-3 py-3 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sm:px-6">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-500 hover:text-white hover:border-white/20 cursor-pointer transition-colors">
              <Bell size={14} />
            </div>
            <a
              href="/"
              target="_blank"
              className="text-xs font-medium text-slate-500 hover:text-white transition-colors whitespace-nowrap"
            >
              ← View site
            </a>
            {/* Quick logout, visible even when the sidebar is collapsed/closed */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="flex-shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        {/* Page outlet */}
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 flex flex-col">
          <Outlet />
        </main>

        <BackToTopButton scrollContainerRef={mainRef} />
      </div>
    </div>
  )
}