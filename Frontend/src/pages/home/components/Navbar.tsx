import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'

const DESKTOP_BREAKPOINT = 1024

const LINKS: { label: string; to: string; authOnly?: boolean }[] = [
  { label: 'Home',         to: '/' },
  { label: 'Properties',   to: '/properties' },
  { label: 'Dashboard',    to: '/dashboard',              authOnly: true },
  { label: 'AI Assistant', to: '/dashboard/ai-assistant', authOnly: true },
  { label: 'Contact',      to: '/contact' },
]

const NAVBAR_STYLES = {
  light: {
    surface: '#FFFFFF',
    border: '#E2E2F0',
    text: '#0F0F1A',
    secondary: '#6B6B8E',
    muted: '#F4F4FA',
    subtle: '#FAFAFF',
  },
  dark: {
    surface: '#0f172a',
    border: '#334155',
    text: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#111827',
    subtle: '#111827',
  },
}

export function Navbar() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const showSignIn = !location.pathname.startsWith('/dashboard') && !isAuthenticated
  const showDashboardBtn = !location.pathname.startsWith('/dashboard') && isAuthenticated
  const isDashboard = location.pathname.startsWith('/dashboard')
  const { toggle: toggleSidebar } = useSidebar()
  const [theme, setTheme] = useTheme()
  const styles = NAVBAR_STYLES[theme]
  const isHome = location.pathname === '/'
  const activeStyles = isHome ? {
    surface: 'transparent',
    border: 'transparent',
    text: '#ffffff',
    secondary: 'rgba(255,255,255,0.9)',
    muted: 'rgba(255,255,255,0.15)',
    subtle: 'rgba(255,255,255,0.25)',
  } : styles

  // Track desktop width in JS so the hamburger can be fully unrendered above
  // the breakpoint — this can't be silently overridden by any conflicting
  // global CSS the way a "lg:hidden" class could be.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT
  )

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const handleChange = () => setIsDesktop(mql.matches)
    handleChange()
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  // Dashboard / AI Assistant only show up while you're actually inside the
  // dashboard section — public pages (Home, Properties, Contact) always show
  // the simple nav, even for a signed-in user.
  const visibleLinks = LINKS.filter(link => !link.authOnly || isDashboard)

  // Pick the single most specific matching link (longest "to"), so nested
  // routes like /dashboard/ai-assistant only highlight "AI Assistant" and
  // not also "Dashboard".
  const activeLabel = visibleLinks.reduce<string | null>((best, link) => {
    const isMatch =
      link.to === '/'
        ? location.pathname === '/'
        : location.pathname === link.to || location.pathname.startsWith(link.to + '/')
    if (!isMatch) return best
    const bestTo = visibleLinks.find(l => l.label === best)?.to ?? ''
    return link.to.length > bestTo.length ? link.label : best
  }, null)

  return (
    <header style={{ position: isHome ? 'absolute' : 'sticky', width: '100%', top:0, left:0, zIndex:100, background:activeStyles.surface, backdropFilter: isHome ? 'none' : 'blur(12px)', borderBottom: isHome ? 'none' : `1px solid ${activeStyles.border}`, fontFamily:'var(--font-sans)' }}>
      <div style={{ width:'100%', padding:'0 20px', height:72, display:'flex', alignItems:'center', gap:32, boxSizing:'border-box' }}>

        <Link to="/" style={{ textDecoration:'none', flexShrink:0 }}>
          <Logo size="md" whiteText={isHome} />
        </Link>

        <nav className="flex items-center gap-4" style={{ marginLeft: 'auto' }}>
          <div className="hidden md:flex" style={{ gap: 4, alignItems: 'center' }}>
            {visibleLinks.map(({ label, to }) => {
              const active = label === activeLabel
              return (
                <Link
                  key={label}
                  to={to}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? activeStyles.text : activeStyles.secondary,
                    background: active ? activeStyles.muted : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = activeStyles.text
                      ;(e.currentTarget as HTMLElement).style.background = activeStyles.muted
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = activeStyles.secondary
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/properties"
              className="hidden md:inline-flex"
              style={{
                padding: '10px 18px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                color: activeStyles.text,
                background: isHome ? 'rgba(0,0,0,0.25)' : 'transparent',
                border: isHome ? '1px solid rgba(0,0,0,0.6)' : `1px solid ${activeStyles.border}`,
                textDecoration: 'none',
                transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = activeStyles.muted
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              Browse Properties
            </Link>
            <ThemeToggle theme={theme} setTheme={setTheme} whiteIcon={isHome} />
            {isDashboard && !isDesktop && (
              <button
                className="navbar-sidebar-toggle"
                onClick={toggleSidebar}
                style={{ background:activeStyles.muted, border:`1px solid ${activeStyles.border}`, borderRadius:8, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = activeStyles.subtle)}
                onMouseLeave={e => (e.currentTarget.style.background = activeStyles.muted)}
              >
                <Menu size={20} color={activeStyles.secondary} />
              </button>
            )}
            {showSignIn && (
              <Link
                to="/auth/signin"
                className="hidden md:inline-flex"
                style={{ padding:'10px 18px', borderRadius:999, fontSize:14, fontWeight:700, color:'white', background:'var(--color-brand)', textDecoration:'none', transition:'transform 0.12s, opacity 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLElement).style.opacity='0.92' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.opacity='1' }}
              >
                Sign in
              </Link>
            )}
            {showDashboardBtn && (
              <Link
                to="/dashboard"
                className="hidden md:inline-flex"
                style={{ padding:'10px 18px', borderRadius:999, fontSize:14, fontWeight:700, color:'white', background:'var(--color-brand)', textDecoration:'none', transition:'transform 0.12s, opacity 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLElement).style.opacity='0.92' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.opacity='1' }}
              >
                Dashboard
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
