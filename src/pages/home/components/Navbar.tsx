// src/pages/home/components/Navbar.tsx
import { useState } from 'react'
import { Link }     from 'react-router-dom'
import { Menu, X }  from 'lucide-react'
import { Logo }     from '@/components/ui/Logo'
import { Button }   from '@/components/ui/Button'

const LINKS = ['Dashboard','AI Assistant']

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header style={{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.92)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--color-border)', fontFamily:'var(--font-sans)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px', height:68, display:'flex', alignItems:'center', gap:32 }}>
        <Logo size="md" />

        {/* Desktop nav links */}
        <nav style={{ display:'flex', gap:4, flex:1 }}>
          {LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g,'-')}`}
              style={{ padding:'7px 14px', borderRadius:8, fontSize:14, fontWeight:500, color:'var(--color-text-secondary)', textDecoration:'none', transition:'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='var(--color-text-heading)'; (e.currentTarget as HTMLElement).style.background='var(--color-bg-muted)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='var(--color-text-secondary)'; (e.currentTarget as HTMLElement).style.background='transparent' }}
            >
              {l}
            </a>
          ))}
        </nav>

        {/* CTA buttons */}
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <Link to="/signin" style={{ padding:'8px 18px', fontSize:14, fontWeight:500, color:'var(--color-text-secondary)', textDecoration:'none', borderRadius:10, transition:'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color='var(--color-text-heading)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color='var(--color-text-secondary)' }}>
            Sign in
          </Link>
          <Link to="/signup">
            <Button size="md" style={{ borderRadius:10, fontWeight:600 }}>Get started free</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
