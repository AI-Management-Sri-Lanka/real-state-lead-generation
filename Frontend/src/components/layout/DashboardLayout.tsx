// src/components/layout/DashboardLayout.tsx
import { Sidebar }  from './Sidebar'
import { Navbar }   from '@/pages/home/components/Navbar'
import { useAuth }  from '@/hooks/useAuth'

interface Props { children: React.ReactNode; activeNav?: string }

export function DashboardLayout({ children, activeNav }: Props) {
  const { user } = useAuth()
  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--color-bg-subtle)', flexDirection:'column' }}>
      <Navbar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
      <Sidebar />
        <main style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
