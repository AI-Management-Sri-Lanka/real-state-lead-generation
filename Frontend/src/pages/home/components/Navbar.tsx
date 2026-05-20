// src/pages/home/components/Navbar.tsx
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'

const LINKS: { label: string; to: string }[] = [
  { label: 'Dashboard',    to: '/dashboard' },
  { label: 'AI Assistant', to: '/dashboard/ai-assistant' },
]

export function Navbar() {
  return (
    <header style={{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-sans)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px', height:68, display:'flex', alignItems:'center', gap:32 }}>
        <Logo size="md" />

        <nav style={{ display:'flex', gap:4, flex:1 }}>
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
        </nav>
      </div>
    </header>
  )
}