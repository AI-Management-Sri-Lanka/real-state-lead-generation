// src/pages/auth/components/AuthFormShell.tsx
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface AuthFormShellProps { width?: number; children: React.ReactNode; className?: string }
export function AuthFormShell({ width=500, children, className }: AuthFormShellProps) {
  const navigate = useNavigate()
  return (
    <div className={`auth-form-shell ${className ?? ""}`} style={{ maxWidth: width, animation:'fadeIn 0.35s ease-out', position: 'relative' }}>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="md:hidden"
        style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', padding: 8, cursor: 'pointer', color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft size={16} />
        <span style={{ fontSize:14, fontWeight:600 }}>Back</span>
      </button>
      <div>{children}</div>
    </div>
  )
}
