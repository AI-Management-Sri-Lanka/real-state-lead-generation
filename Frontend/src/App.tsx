import { Routes, Route, Navigate } from 'react-router-dom'
import AIChat from '@/pages/dashboard/AIChat'
import { useAuth } from '@/hooks/useAuth'
import { SidebarProvider } from '@/contexts/SidebarContext'
import HomePage from './pages/home/HomePage'
import Dashboard from './pages/dashboard/Dashboard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { BackToTopButton } from '@/components/ui/BackToTopButton'
import SignInPage from './pages/auth/SignInPage'
import SignUpPage from './pages/auth/SignUpPage'
import PropertiesPage from '@/pages/properties/propertiesPage'
import PropertyDetailPage from '@/pages/properties/propertyDetailPage'
import MyPropertiesList from '@/pages/dashboard/properties/MyPropertiesList'
import PropertyManager from '@/pages/dashboard/properties/PropertyManager'
import InquiriesList from '@/pages/dashboard/InquiriesList'
import FoundLeadsPage from '@/pages/dashboard/FoundLeadsPage'
import SettingsPage from './pages/dashboard/SettingsPage'
import ContactPage from '@/pages/contactPage'
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminPropertiesPage from '@/pages/admin/AdminPropertiesPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminSessionsPage from '@/pages/admin/AdminSessionsPage'
import AdminManagePage from '@/pages/admin/AdminManagePage'
import AdminInquiriesPage from '@/pages/admin/AdminInquiriesPage'

// ── Route guards ──────────────────────────────────────────────────────────────

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/signin" replace />
}

/** Protects admin routes by checking for aimsl_admin_token in localStorage */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const hasAdminToken = !!localStorage.getItem('aimsl_admin_token')
  return hasAdminToken ? <>{children}</> : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <SidebarProvider>
      <BackToTopButton />
      <Routes>
        {/* ── Public ─────────────────────────────────────────────────── */}
        <Route path="/"                  element={<HomePage />} />
        <Route path="/properties"        element={<PropertiesPage />} />
        <Route path="/properties/:id"    element={<PropertyDetailPage />} />
        <Route path="/contact"           element={<ContactPage />} />

        {/* ── Auth ───────────────────────────────────────────────────── */}
        <Route path="/auth/signin"       element={<SignInPage />} />
        <Route path="/auth/signup"       element={<SignUpPage />} />

        {/* ── Owner Dashboard ────────────────────────────────────────── */}
        <Route path="/dashboard" element={<PrivateRoute><ErrorBoundary><Dashboard /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard/ai-assistant" element={<PrivateRoute><ErrorBoundary><AIChat /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard/settings" element={<PrivateRoute><ErrorBoundary><SettingsPage /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard/properties" element={<PrivateRoute><ErrorBoundary><MyPropertiesList /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard/properties/add" element={<PrivateRoute><ErrorBoundary><PropertyManager /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard/requests" element={<PrivateRoute><ErrorBoundary><InquiriesList /></ErrorBoundary></PrivateRoute>} />
        <Route path="/dashboard/found-leads" element={<PrivateRoute><ErrorBoundary><FoundLeadsPage /></ErrorBoundary></PrivateRoute>} />

        {/* ── Master Admin Login ─────────────────────────────────────── */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ── Master Admin Portal (nested layout with sidebar) ───────── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"      element={<AdminDashboardPage />} />
          <Route path="properties"     element={<AdminPropertiesPage />} />
          <Route path="properties/add" element={<ErrorBoundary><PropertyManager /></ErrorBoundary>} />
          <Route path="users"          element={<AdminUsersPage />} />
          <Route path="sessions"       element={<AdminSessionsPage />} />
          <Route path="inquiries"      element={<AdminInquiriesPage />} />
          <Route path="manage"         element={<AdminManagePage />} />
        </Route>

        {/* ── Fallback ───────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SidebarProvider>
  )
}