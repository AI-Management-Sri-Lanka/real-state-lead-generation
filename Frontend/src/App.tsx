import { Routes, Route, Navigate } from 'react-router-dom'
import AIChat from '@/pages/dashboard/AIChat'
import { useAuth } from '@/hooks/useAuth'
import { SidebarProvider } from '@/contexts/SidebarContext'
import HomePage from './pages/home/HomePage'
import Dashboard from './pages/dashboard/Dashboard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import SignInPage from './pages/auth/SignInPage'
import SignUpPage from './pages/auth/SignUpPage'
import PropertiesPage from '@/pages/properties/propertiesPage'
import PropertyDetailPage from '@/pages/properties/propertyDetailPage'
import PropertyManager from '@/pages/dashboard/properties/PropertyManager'
import MyPropertiesList from '@/pages/dashboard/properties/MyPropertiesList'

import SettingsPage from './pages/dashboard/SettingsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  // While auth state is being restored, don't redirect — wait silently.
  if (isLoading) return null
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/signin" replace />
}

export default function App() {
  return (
    <SidebarProvider>
      <Routes>
        <Route path="/"                       element={<HomePage />} />
        <Route path="/dashboard/ai-assistant" element={<PrivateRoute><ErrorBoundary><AIChat /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard/settings"     element={<PrivateRoute><ErrorBoundary><SettingsPage /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard/properties"   element={<PrivateRoute><ErrorBoundary><MyPropertiesList /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard/properties/add" element={<PrivateRoute><ErrorBoundary><PropertyManager /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard"              element={<PrivateRoute><ErrorBoundary><Dashboard /></ErrorBoundary></PrivateRoute>} />
        <Route path="/auth/signin"            element={<SignInPage />} />
        <Route path="/auth/signup"            element={<SignUpPage />} />
        <Route path="/properties"             element={<PropertiesPage />} />
        <Route path="/properties/:id"         element={<PropertyDetailPage />} />
        <Route path="*"                       element={<Navigate to="/" replace />} />
      </Routes>
    </SidebarProvider>
  )
}