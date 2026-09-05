// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './styles/globals.css'
import { AuthProvider } from './contexts/AuthContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Only mount the Google OAuth provider when a client ID is actually
// configured, so the app still runs fine (minus the Google button) for
// anyone who hasn't set up Google sign-in yet.
function OptionalGoogleOAuthProvider({ children }: { children: React.ReactNode }) {
  if (!GOOGLE_CLIENT_ID) {
    if (import.meta.env.DEV) {
      console.warn('[auth] VITE_GOOGLE_CLIENT_ID is not set — "Continue with Google" will be disabled.')
    }
    return <>{children}</>
  }
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <OptionalGoogleOAuthProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1A2332',
                color: '#D0DBE6',
                border: '1px solid #2E3F55',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#0F9B6E', secondary: '#1A2332' } },
              error:   { iconTheme: { primary: '#EF4444', secondary: '#1A2332' } },
            }}
          />
        </AuthProvider>
      </OptionalGoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)