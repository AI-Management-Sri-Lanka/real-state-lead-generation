import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from '@/hooks/useTheme'

const LINKS: { label: string; to: string }[] = [
  { label: 'Dashboard',    to: '/dashboard' },
  { label: 'AI Assistant', to: '/dashboard/ai-assistant' },
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
  const location = useLocation()
  const showSignIn = !location.pathname.startsWith('/dashboard')
  const isDashboard = location.pathname.startsWith('/dashboard')
  const isContact = location.pathname === '/contact'
  const { toggle: toggleSidebar } = useSidebar()
  const [theme, setTheme] = useTheme()
  const styles = NAVBAR_STYLES[theme]
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <header style={{ position:'sticky', top:0, zIndex:100, background:styles.surface, backdropFilter:'blur(12px)', borderBottom:`1px solid ${styles.border}`, fontFamily:'var(--font-sans)' }}>
      <div style={{ width:'100%', padding:'0 20px', height:72, display:'flex', alignItems:'center', gap:32, boxSizing:'border-box' }}>

        <Link to="/" style={{ textDecoration:'none', flexShrink:0 }}>
          <Logo size="md" />
        </Link>

        <nav className="flex items-center gap-4" style={{ marginLeft: 'auto' }}>
          <div className="hidden md:flex" style={{ gap: 4, alignItems: 'center' }}>
            {LINKS.map(({ label, to }) => {
              const active = location.pathname === to || (to !== '/contact' && location.pathname.startsWith(to))
              return (
                <Link
                  key={label}
                  to={to}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? styles.text : styles.secondary,
                    background: active ? styles.muted : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = styles.text
                      ;(e.currentTarget as HTMLElement).style.background = styles.muted
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = styles.secondary
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
            <ThemeToggle theme={theme} setTheme={setTheme} />
            {isDashboard && (
              <button
                className="navbar-sidebar-toggle"
                onClick={toggleSidebar}
                style={{ background:styles.muted, border:`1px solid ${styles.border}`, borderRadius:8, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = styles.subtle)}
                onMouseLeave={e => (e.currentTarget.style.background = styles.muted)}
              >
                <Menu size={20} color={styles.secondary} />
              </button>
            )}
            {!isDashboard && (
              <button
                className="md:hidden"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setMobileMenuOpen(open => !open)}
                style={{ background:styles.muted, border:`1px solid ${styles.border}`, borderRadius:8, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = styles.subtle)}
                onMouseLeave={e => (e.currentTarget.style.background = styles.muted)}
              >
                {isMobileMenuOpen ? <X size={20} color={styles.secondary} /> : <Menu size={20} color={styles.secondary} />}
              </button>
            )}
            {showSignIn && !isContact && (
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
          </div>
        </nav>
      </div>

      {!isDashboard && isMobileMenuOpen && (
        <div
          className="md:hidden"
          style={{ borderTop:`1px solid ${styles.border}`, background:styles.surface, padding:'8px 20px 16px', display:'flex', flexDirection:'column', gap:4 }}
        >
          {LINKS.map(({ label, to }) => {
            const active = location.pathname === to || (to !== '/contact' && location.pathname.startsWith(to))
            return (
              <Link
                key={label}
                to={to}
                style={{
                  padding:'10px 14px',
                  borderRadius:8,
                  fontSize:15,
                  fontWeight: active ? 600 : 500,
                  color: active ? styles.text : styles.secondary,
                  background: active ? styles.muted : 'transparent',
                  textDecoration:'none',
                }}
              >
                {label}
              </Link>
            )
          })}
          {showSignIn && !isContact && (
            <Link
              to="/auth/signin"
              style={{ marginTop:8, padding:'10px 18px', borderRadius:999, fontSize:14, fontWeight:700, color:'white', background:'var(--color-brand)', textDecoration:'none', textAlign:'center' }}
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  )
}