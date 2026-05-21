// src/pages/auth/components/AuthDivider.tsx
interface AuthDividerProps { label?: string }
export function AuthDivider({ label='or continue with' }: AuthDividerProps) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'22px 0' }}>
      <div style={{ flex:1, height:1, background:'var(--color-border)' }} />
      <span style={{ fontSize:13, color:'var(--color-text-placeholder)', whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'var(--color-border)' }} />
    </div>
  )
}
