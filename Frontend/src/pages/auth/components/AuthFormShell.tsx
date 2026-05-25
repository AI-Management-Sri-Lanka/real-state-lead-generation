// src/pages/auth/components/AuthFormShell.tsx
interface AuthFormShellProps { width?: number; children: React.ReactNode; className?: string }
export function AuthFormShell({ width=500, children, className }: AuthFormShellProps) {
  return (
    <div className={["auth-form-shell", className ?? ""].join(' ')} style={{ width: '100%', maxWidth: width, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 64px', background:'var(--color-surface)', overflowY:'auto' }}>
      <div style={{ animation:'fadeIn 0.35s ease-out' }}>{children}</div>
    </div>
  )
}
