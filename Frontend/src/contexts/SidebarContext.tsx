import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)

  // Auto-close the mobile drawer whenever the route changes.
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
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
