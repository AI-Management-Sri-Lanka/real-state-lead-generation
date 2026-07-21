import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
  collapsed: boolean
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

const COLLAPSE_STORAGE_KEY = 'sidebar:collapsed'

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  // Desktop sidebar — expanded by default, collapses in place
  const [isCollapsed, setIsCollapsed] = useState(false)

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1'
  })

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  // The mobile drawer (DashboardLayout) opens this on top of the page; on
  // navigation the underlying route changes but nothing else was closing it,
  // so it stayed open and blocked the new page's content.
  const { pathname } = useLocation()
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const toggleCollapsed = () => setCollapsed((prev) => !prev)

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close, collapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}
export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}