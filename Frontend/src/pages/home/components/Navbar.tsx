import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'

const PUBLIC_LINKS: { label: string; to: string }[] = [
  { label: 'Home',         to: '/' },
  { label: 'Properties',   to: '/properties' },
  { label: 'Contact',      to: '/contact' },
]

const AUTH_ONLY_LINKS: { label: string; to: string }[] = [
  { label: 'Dashboard',    to: '/dashboard' },
  { label: 'AI Assistant', to: '/dashboard/ai-assistant' },
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
  const location = useLocation()
  const showSignIn = !location.pathname.startsWith('/dashboard')
  const isDashboard = location.pathname.startsWith('/dashboard')
  const isContact = location.pathname === '/contact'
  const { toggle: toggleSidebar, toggleCollapse } = useSidebar()
  const [theme, setTheme] = useTheme()
  const { isAuthenticated } = useAuth()
  const styles = NAVBAR_STYLES[theme]
  const links = isAuthenticated ? [...PUBLIC_LINKS, ...AUTH_ONLY_LINKS] : PUBLIC_LINKS
  
  const isHome = location.pathname === '/'
  const activeStyles = isHome ? {
    surface: 'transparent',
    border: 'transparent',
    text: '#ffffff',
    secondary: 'rgba(255,255,255,0.9)',
    muted: 'rgba(255,255,255,0.15)',
    subtle: 'rgba(255,255,255,0.25)',
  } : styles

  const activeTo = links
    .map(l => l.to)
    .filter(to => location.pathname === to || (to !== '/contact' && location.pathname.startsWith(to + '/')))
    .sort((a, b) => b.length - a.length)[0]

  // The mobile drawer and desktop sidebar are separate layout mechanisms
  // (overlay vs. in-flow width), so pick which one this click should control.
  function handleSidebarToggleClick() {
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1025px)').matches
    if (isDesktop) toggleCollapse()
    else toggleSidebar()
  }

  return (
    <header style={{ position: isHome ? 'absolute' : 'sticky', width: '100%', top:0, left:0, zIndex:100, background:activeStyles.surface, backdropFilter: isHome ? 'none' : 'blur(12px)', borderBottom: isHome ? 'none' : `1px solid ${activeStyles.border}`, fontFamily:'var(--font-sans)' }}>
      <div style={{ width:'100%', padding:'0 20px', height:72, display:'flex', alignItems:'center', gap:32, boxSizing:'border-box' }}>

        <Link to="/" style={{ textDecoration:'none', flexShrink:0 }}>
          <Logo size="md" whiteText={isHome} />
        </Link>

        <nav className="flex items-center gap-4" style={{ marginLeft: 'auto' }}>
          <div className="hidden md:flex" style={{ gap: 4, alignItems: 'center' }}>
            {links.map(({ label, to }) => {
              const active = to === activeTo
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
            {isDashboard && (
              <button
                className="navbar-sidebar-toggle"
                onClick={handleSidebarToggleClick}
                style={{ background:activeStyles.muted, border:`1px solid ${activeStyles.border}`, borderRadius:8, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = activeStyles.subtle)}
                onMouseLeave={e => (e.currentTarget.style.background = activeStyles.muted)}
              >
                <Menu size={20} color={activeStyles.secondary} />
              </button>
            )}
            {showSignIn && (
              isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="hidden md:inline-flex"
                  style={{ padding:'10px 18px', borderRadius:999, fontSize:14, fontWeight:700, color:'white', background:'var(--color-brand)', textDecoration:'none', transition:'transform 0.12s, opacity 0.12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLElement).style.opacity='0.92' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.opacity='1' }}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/auth/signin"
                  className="hidden md:inline-flex"
                  style={{ padding:'10px 18px', borderRadius:999, fontSize:14, fontWeight:700, color:'white', background:'var(--color-brand)', textDecoration:'none', transition:'transform 0.12s, opacity 0.12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLElement).style.opacity='0.92' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='none'; (e.currentTarget as HTMLElement).style.opacity='1' }}
                >
                  Sign in
                </Link>
              )
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}