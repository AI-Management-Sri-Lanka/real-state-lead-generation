// src/pages/auth/components/AuthBrandPanel.tsx
// Left gradient panel — matches LeadAI screenshot (deep blue-indigo-green gradient)
import { Logo } from '@/components/ui/Logo'
import { Link } from 'react-router-dom'

interface AuthBrandPanelProps {
  heading:    React.ReactNode
  subheading: string
  bullets:    string[]
  className?: string
  /** Optional badge shown next to the logo, e.g. "ADMIN". Omit for the
   * regular user-facing auth pages. */
  logoSuffix?: string
}

export function AuthBrandPanel({ heading, subheading, bullets, className, logoSuffix }: AuthBrandPanelProps) {
  return (
    <div className={`auth-brand-panel ${className ?? ""}`} style={{
      position:'relative', overflow:'hidden',
    }}>
      {/* Grid overlay */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />

      {/* Logo top-left */}
      <div className="auth-brand-logo" style={{ position:'absolute', zIndex:10 }}>
        <Link to="/" className="auth-brand-logo-link" style={{ display:'flex', alignItems:'center', textDecoration:'none' }}>
          <div className="auth-brand-logo-icon" style={{ borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg className="auth-brand-logo-svg" viewBox="0 0 22 22" fill="none">
              <path d="M11 3C7.13 3 4 6.13 4 10c0 2.45 1.27 4.61 3.18 5.88L6 19l3.28-1.09A7 7 0 1 0 11 3z" fill="white"/>
              <circle cx="8.5" cy="10" r="1.2" fill="#3D3BF3"/><circle cx="11" cy="10" r="1.2" fill="#3D3BF3"/><circle cx="13.5" cy="10" r="1.2" fill="#3D3BF3"/>
            </svg>
          </div>
          <span className="auth-brand-logo-text" style={{ color:'white', fontWeight:700, fontFamily:'var(--font-sans)' }}>LeadAI</span>
          {logoSuffix && (
            <span style={{
              marginLeft:8, padding:'3px 8px', borderRadius:6,
              background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)',
              fontSize:11, fontWeight:700, letterSpacing:'0.06em', fontFamily:'var(--font-sans)',
            }}>
              {logoSuffix}
            </span>
          )}
        </Link>
      </div>

      {/* Main content — bottom aligned */}
      <div style={{ position:'relative', zIndex:1, padding:'48px 56px' }}>
        <h1 style={{ fontSize:42, fontWeight:800, lineHeight:1.15, color:'white', letterSpacing:'-0.03em', marginBottom:16 }}>
          {heading}
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.7, maxWidth:440, marginBottom:28 }}>
          {subheading}
        </p>
        <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
          {bullets.map(b => (
            <li key={b} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:'#00C896', flexShrink:0 }} />
              <span style={{ color:'rgba(255,255,255,0.85)', fontSize:14 }}>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}