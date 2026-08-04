import PropTypes from 'prop-types'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from '@/pages/home/components/Navbar'
import { useSidebar } from '@/contexts/SidebarContext'
import { BackToTopButton } from '@/components/ui/BackToTopButton'

interface Props { children: React.ReactNode; activeNav?: string }

const EXPANDED_WIDTH = 260
const COLLAPSED_WIDTH = 76

export function DashboardLayout({ children }: Props) {
  const { isOpen: sidebarOpen, close: closeSidebar, collapsed } = useSidebar()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    closeSidebar()
  }, [pathname, closeSidebar])

  return (
    <div className="h-screen flex min-w-full flex-col bg-page overflow-hidden" style={{ color: 'var(--color-text-primary)' }}>
      <Navbar />
      <div className="relative flex h-[calc(100vh-72px)] overflow-hidden">
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

        <aside
          className="dashboard-sidebar-desktop hidden h-full flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out lg:block"
          style={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        >
          <Sidebar />
        </aside>

        <main ref={mainRef} className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </main>

        <BackToTopButton scrollContainerRef={mainRef} />
      </div>
    </div>
  )
}

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
}