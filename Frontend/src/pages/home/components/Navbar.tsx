// src/pages/home/components/Navbar.tsx
import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useSidebar } from '@/contexts/SidebarContext'

const LINKS: { label: string; to: string }[] = [
  { label: 'Dashboard',    to: '/dashboard' },
  { label: 'AI Assistant', to: '/dashboard/ai-assistant' },
]

export function Navbar() {
  const location = useLocation()
  const showSignIn = !location.pathname.startsWith('/dashboard')
  const isDashboard = location.pathname.startsWith('/dashboard')
  const { toggle: toggleSidebar } = useSidebar()

  return (
    <header style={{ position:'sticky', top:0, zIndex:100, background:'var(--color-surface)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-sans)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px', height:68, display:'flex', alignItems:'center', gap:28 }}>
        <Logo size="md" />

        <nav style={{ display:'flex', gap:4, flex:1, alignItems:'center' }}>
          {LINKS.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              style={{ padding:'7px 14px', borderRadius:8, fontSize:14, fontWeight:500, color:'var(--color-text-secondary)', textDecoration:'none', transition:'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='var(--color-text-heading)'; (e.currentTarget as HTMLElement).style.background='var(--color-bg-muted)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='var(--color-text-secondary)'; (e.currentTarget as HTMLElement).style.background='transparent' }}
            >
              {label}
            </Link>
          ))}

          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
            <ThemeToggle />
            {isDashboard && (
              <button
                className="navbar-sidebar-toggle"
                onClick={toggleSidebar}
                style={{ background:'var(--color-bg-muted)', border:'1px solid var(--color-border)', borderRadius:8, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-subtle)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-bg-muted)')}
              >
                <Menu size={20} color="var(--color-text-secondary)" />
              </button>
            )}
            {showSignIn && (
              <Link
                to="/auth/signin"
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
    </header>
  )
}