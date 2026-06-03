// src/pages/home/components/Navbar.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useSidebar } from '@/contexts/SidebarContext'
import { useTheme } from '@/hooks/useTheme'
import { useState } from 'react'

const LINKS: { label: string; to: string }[] = [
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
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isHome = location.pathname === '/'
  const showSignIn = !location.pathname.startsWith('/dashboard')
  const isDashboard = location.pathname.startsWith('/dashboard')
  const { toggle: toggleSidebar } = useSidebar()
  const [theme, setTheme] = useTheme()
  const styles = NAVBAR_STYLES[theme]

  return (
    <header style={{ position:'sticky', top:0, zIndex:100, background:styles.surface, backdropFilter:'blur(12px)', borderBottom:`1px solid ${styles.border}`, fontFamily:'var(--font-sans)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', height:72, display:'flex', alignItems:'center', gap:32 }}>
        <Logo size="md" />

        <nav className="flex items-center gap-4" style={{ marginLeft: 'auto' }}>
          <div className="hidden md:flex" style={{ gap: 4, alignItems: 'center' }}>
            {LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                style={{ padding:'7px 14px', borderRadius:8, fontSize:14, fontWeight:500, color:styles.secondary, textDecoration:'none', transition:'all 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color=styles.text; (e.currentTarget as HTMLElement).style.background=styles.muted }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color=styles.secondary; (e.currentTarget as HTMLElement).style.background='transparent' }}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button
              type="button"
              className="md:hidden flex items-center justify-center"
              onClick={() => setIsMenuOpen(open => !open)}
              style={{ background:styles.muted, border:`1px solid ${styles.border}`, borderRadius:8, width:40, height:40, cursor:'pointer', transition:'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = styles.subtle)}
              onMouseLeave={e => (e.currentTarget.style.background = styles.muted)}
            >
              <Menu size={20} color={styles.secondary} />
            </button>
            {isDashboard && (
              <button
                className="navbar-sidebar-toggle hidden md:flex items-center justify-center"
                onClick={toggleSidebar}
                style={{ background:styles.muted, border:`1px solid ${styles.border}`, borderRadius:8, width:40, height:40, cursor:'pointer', transition:'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = styles.subtle)}
                onMouseLeave={e => (e.currentTarget.style.background = styles.muted)}
              >
                <Menu size={20} color={styles.secondary} />
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
          </div>
        </nav>
        {isMenuOpen && (
          <div className="md:hidden" style={{ background: styles.surface, borderTop: `1px solid ${styles.border}` }}>
            {isHome ? (
              <>
                <button
                  type="button"
                  onClick={() => { setIsMenuOpen(false); navigate('/auth/signin') }}
                  style={{ width:'100%', textAlign:'left', padding:'14px 20px', borderBottom:`1px solid ${styles.border}`, background:'transparent', color:styles.text, fontSize:15, fontWeight:600, cursor:'pointer' }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setIsMenuOpen(false); navigate('/auth/signup') }}
                  style={{ width:'100%', textAlign:'left', padding:'14px 20px', background:'transparent', color:styles.text, fontSize:15, fontWeight:600, cursor:'pointer' }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                {LINKS.map(({ label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setIsMenuOpen(false); navigate('/auth/signin') }}
                    style={{ width:'100%', textAlign:'left', padding:'14px 20px', borderBottom:`1px solid ${styles.border}`, background:'transparent', color:styles.text, fontSize:15, fontWeight:600, cursor:'pointer' }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setIsMenuOpen(false); navigate('/auth/signin') }}
                  style={{ width:'100%', textAlign:'left', padding:'14px 20px', background:'transparent', color:styles.text, fontSize:15, fontWeight:700, cursor:'pointer' }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}