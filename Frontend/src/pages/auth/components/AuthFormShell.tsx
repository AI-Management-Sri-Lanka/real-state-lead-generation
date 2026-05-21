// src/pages/auth/components/AuthFormShell.tsx
interface AuthFormShellProps { width?: number; children: React.ReactNode }
export function AuthFormShell({ width=500, children }: AuthFormShellProps) {
  return (
    <div style={{ width, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 64px', background:'var(--color-surface)', overflowY:'auto' }}>
      <div style={{ animation:'fadeIn 0.35s ease-out' }}>{children}</div>
    </div>
  )
}
