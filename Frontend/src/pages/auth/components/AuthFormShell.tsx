// src/pages/auth/components/AuthFormShell.tsx
interface AuthFormShellProps { width?: number; children: React.ReactNode; className?: string }
export function AuthFormShell({ width=500, children, className }: AuthFormShellProps) {
  return (
    <div className={`auth-form-shell ${className ?? ""}`} style={{ maxWidth: width, animation:'fadeIn 0.35s ease-out' }}>
      <div>{children}</div>
    </div>
  )
}
