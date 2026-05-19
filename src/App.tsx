// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
// import HomePage        from '@/pages/home/HomePage'
// import SignInPage      from '@/pages/auth/SignInPage'
// import SignUpPage      from '@/pages/auth/SignUpPage'
// import AIAssistantPage from '@/pages/dashboard/AIAssistantPage'
import { useAuth }     from '@/hooks/useAuth'
import HomePage from './pages/home/HomePage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/"                        element={<HomePage />} />
      <Route path="*"                        element={<Navigate to="/" replace />} />
    </Routes>
  )
}
