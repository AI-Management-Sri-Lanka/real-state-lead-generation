// src/components/layout/Sidebar.tsx  — matches LeadAI screenshot (white, left nav)
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, MessageSquare, Search, BarChart2, Settings, LogOut } from 'lucide-react'
import { Avatar }  from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'

const MAIN_NAV = [
  { to:'/dashboard',              icon:LayoutDashboard, label:'Dashboard' },
  { to:'/dashboard/ai-assistant', icon:MessageSquare,   label:'AI Chat' },
]
const ACCOUNT_NAV = [
  { to:'/dashboard/settings', icon:Settings, label:'Settings' },
]

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <aside style={{ width:220, minWidth:220, height:'100vh', background:'var(--color-surface)', borderRight:'1px solid var(--color-border)', display:'flex', flexDirection:'column', padding:'0 0 20px', position:'sticky', top:0, fontFamily:'var(--font-sans)' }}>
      {/* MAIN section */}
      <div style={{ padding:'12px 12px 0' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--color-text-placeholder)', letterSpacing:'0.08em', padding:'0 8px 8px', textTransform:'uppercase' }}>Main</div>
        {MAIN_NAV.map(({ to, icon:Icon, label }) => (
          <NavLink key={to} to={to} end={to==='/dashboard'}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 12px', borderRadius:10, marginBottom:2,
              textDecoration:'none', fontSize:14, fontWeight:500,
              color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              background: isActive ? 'var(--color-nav-active-bg)' : 'transparent',
              transition:'all 0.12s',
            })}
            onMouseEnter={e => { const a = e.currentTarget as HTMLElement; if (!a.style.background.includes('EEEEFF')) { a.style.background='var(--color-sidebar-hover)'; a.style.color='var(--color-text-primary)' } }}
            onMouseLeave={e => { const a = e.currentTarget as HTMLElement; if (!a.style.background.includes('EEEEFF')) { a.style.background='transparent'; a.style.color='var(--color-text-secondary)' } }}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* ACCOUNT section */}
      <div style={{ padding:'16px 12px 0' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--color-text-placeholder)', letterSpacing:'0.08em', padding:'0 8px 8px', textTransform:'uppercase' }}>Account</div>
        {ACCOUNT_NAV.map(({ to, icon:Icon, label }) => (
          <NavLink key={to} to={to}
            style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 12px', borderRadius:10, marginBottom:2,
              textDecoration:'none', fontSize:14, fontWeight:500,
              color: isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
              background: isActive ? 'var(--color-nav-active-bg)' : 'transparent',
              transition:'all 0.12s',
            })}
          >
            <Icon size={17} /> {label}
          </NavLink>
        ))}
        <button onClick={() => { signOut(); navigate('/signin') }}
          style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px', borderRadius:10, background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', fontSize:14, fontWeight:500, fontFamily:'var(--font-sans)', transition:'all 0.12s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='var(--color-sidebar-hover)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='none' }}
        >
          <LogOut size={17} /> Sign out
        </button>
      </div>

      <div style={{ flex:1 }} />

      {/* User card */}
      <div style={{ margin:'0 12px', padding:'12px', borderRadius:12, background:'var(--color-bg-muted)', border:'1px solid var(--color-border)', display:'flex', alignItems:'center', gap:10 }}>
        <Avatar name={user?.name ?? 'User'} size={32} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--color-text-heading)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name ?? 'User'}</div>
          <div style={{ fontSize:11, color:'var(--color-text-placeholder)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
        </div>
      </div>
    </aside>
  )
}
