// src/components/layout/DashboardLayout.tsx
import { Sidebar }  from './Sidebar'
import { Navbar }   from '@/pages/home/components/Navbar'
import { useAuth }  from '@/hooks/useAuth'
import { useSidebar } from '@/contexts/SidebarContext'

interface Props { children: React.ReactNode; activeNav?: string }

export function DashboardLayout({ children, activeNav }: Props) {
  const { user } = useAuth()
  const { isOpen: sidebarOpen, toggle: toggleSidebar, close: closeSidebar } = useSidebar()

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--color-bg-subtle)', flexDirection:'column' }}>
      <Navbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            onClick={closeSidebar}
            style={{
              position:'fixed',
              inset:0,
              background:'rgba(0,0,0,0.5)',
              zIndex:40,
            }}
            className="dashboard-sidebar-backdrop"
          />
        )}

        {/* Sidebar */}
        <aside style={{
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition:'transform 0.3s ease',
          position:'fixed',
          left:0,
          top:68,
          height:'calc(100vh - 68px)',
          zIndex:45,
        }} className="dashboard-sidebar-mobile">
          <Sidebar />
        </aside>

        {/* Desktop sidebar */}
        <aside className="dashboard-sidebar-desktop">
          <Sidebar />
        </aside>

        <main style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
