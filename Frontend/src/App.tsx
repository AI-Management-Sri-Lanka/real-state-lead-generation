import { Routes, Route, Navigate } from 'react-router-dom'
import AIChat from '@/pages/dashboard/AIChat'
import { useAuth } from '@/hooks/useAuth'
import { SidebarProvider } from '@/contexts/SidebarContext'
import HomePage from './pages/home/HomePage'
import Dashboard from './pages/dashboard/Dashboard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import SignInPage from './pages/auth/SignInPage'
import SignUpPage from './pages/auth/SignUpPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/signin" replace />
}

export default function App() {
  return (
    <SidebarProvider>
      <Routes>
        <Route path="/"               element={<HomePage />} />
        <Route path="/dashboard/ai-assistant" element={<PrivateRoute><ErrorBoundary><AIChat /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><ErrorBoundary><Dashboard /></ErrorBoundary></PrivateRoute>} />
        <Route path="/auth/signin" element={<SignInPage />} />
        <Route path="/auth/signup" element={<SignUpPage />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </SidebarProvider>
  )
}