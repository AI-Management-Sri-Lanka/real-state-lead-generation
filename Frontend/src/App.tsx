import { Routes, Route, Navigate } from 'react-router-dom'
import AIAssistantPage from '@/pages/dashboard/AIAssistantPage'
import { useAuth }     from '@/hooks/useAuth'
import { SidebarProvider } from '@/contexts/SidebarContext'
import HomePage        from './pages/home/HomePage'
import DashboardPage from './pages/dashboard/DashboardPage'
import SignInPage     from './pages/auth/SignInPage'
import SignUpPage     from './pages/auth/SignUpPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />
}

export default function App() {
  return (
    <SidebarProvider>
      <Routes>
        <Route path="/"               element={<HomePage />} />
        <Route path="/dashboard/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/auth/signin" element={<SignInPage />} />
        <Route path="/auth/signup" element={<SignUpPage />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </SidebarProvider>
  )
}