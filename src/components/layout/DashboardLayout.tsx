// src/components/layout/DashboardLayout.tsx
import { Bell, Settings } from 'lucide-react'
import { Sidebar }  from './Sidebar'
import { Logo }     from '@/components/ui/Logo'
import { Avatar }   from '@/components/ui/Avatar'
import { useAuth }  from '@/hooks/useAuth'

const NAV_LINKS = ['Dashboard','Leads','AI Chat','Discover','Analytics']

interface Props { children: React.ReactNode; activeNav?: string }

export function DashboardLayout({ children, activeNav }: Props) {
  const { user } = useAuth()
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--color-bg-subtle)' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Top navbar — matches screenshot */}
        <header style={{ height:60, background:'var(--color-surface)', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', padding:'0 28px', gap:24, flexShrink:0, boxShadow:'var(--shadow-sm)' }}>
          <Logo size="sm" />
          <nav style={{ display:'flex', gap:4, flex:1, marginLeft:8 }}>
            {NAV_LINKS.map(link => (
              <button key={link}
                style={{ padding:'6px 14px', borderRadius:8, border:'none', background: activeNav===link ? 'var(--color-nav-active-bg)' : 'transparent', color: activeNav===link ? 'var(--color-brand)' : 'var(--color-text-secondary)', fontSize:14, fontWeight:500, fontFamily:'var(--font-sans)', cursor:'pointer', transition:'all 0.12s' }}>
                {link}
              </button>
            ))}
          </nav>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button style={{ width:36, height:36, borderRadius:10, border:'1px solid var(--color-border)', background:'var(--color-surface)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-text-secondary)' }}>
              <Bell size={18} />
            </button>
            <button style={{ width:36, height:36, borderRadius:10, border:'1px solid var(--color-border)', background:'var(--color-surface)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-text-secondary)' }}>
              <Settings size={18} />
            </button>
            <Avatar name={user?.name ?? 'AS'} size={34} />
          </div>
        </header>
        <main style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
