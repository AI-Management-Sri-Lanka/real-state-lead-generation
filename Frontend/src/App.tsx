import { Routes, Route, Navigate } from 'react-router-dom'
import AIAssistantPage from '@/pages/dashboard/AIAssistantPage'
import { useAuth }     from '@/hooks/useAuth'
import HomePage        from './pages/home/HomePage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"               element={<HomePage />} />
      <Route path="/dashboard/ai-assistant" element={<AIAssistantPage />} />
      <Route path="*"               element={<Navigate to="/" replace />} />
    </Routes>
  )
}