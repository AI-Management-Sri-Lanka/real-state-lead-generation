import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

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

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggleCollapsed = useCallback(() => setCollapsed((prev) => !prev), [])

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