// src/components/layout/DashboardLayout.tsx
import PropTypes from 'prop-types'
import { Sidebar } from './Sidebar'
import { Navbar } from '@/pages/home/components/Navbar'
import { useSidebar } from '@/contexts/SidebarContext'

interface Props { children: React.ReactNode; activeNav?: string }

export function DashboardLayout({ children }: Props) {
  const { isOpen: sidebarOpen, close: closeSidebar } = useSidebar()

  return (
    <div className="h-screen flex min-w-full flex-col overflow-hidden bg-page" style={{ color: 'var(--color-text-primary)' }}>
      <Navbar />
      <div className="relative flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div
            onClick={closeSidebar}
            className="dashboard-sidebar-backdrop fixed inset-0 z-40 bg-black/50"
          />
        )}

        <aside
          className="dashboard-sidebar-mobile fixed left-0 top-[72px] z-50 h-[calc(100vh-72px)] w-[260px] transition-transform duration-300 ease-out lg:hidden"
          style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <Sidebar />
        </aside>

        <aside className="dashboard-sidebar-desktop hidden w-[260px] flex-shrink-0 lg:block">
          <Sidebar />
        </aside>

        <main className="flex flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
}
