// src/pages/dashboard/components/ChatHeader.tsx
import { Sparkles, Menu } from 'lucide-react'

interface Props {
  /** Called when the mobile hamburger is tapped to open the session sidebar */
  onMenuToggle?: () => void
}

export function ChatHeader({ onMenuToggle }: Props) {
  return (
    <div
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}
    >
      
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          aria-label="Open chat history"
          className="mr-1 flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden"
        >
          <Menu size={18} />
        </button>
      )}

      {/* AI brand mark */}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'linear-gradient(135deg,#3D3BF3,#00C896)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(61,59,243,0.28)',
        flexShrink: 0,
      }}>
        <Sparkles size={17} style={{ color: 'white' }} />
      </div>

      {/* Title */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-heading)', lineHeight: 1.2 }}>
          AI Lead Assistant
        </div>
        <div style={{
          fontSize: 11, color: 'var(--color-success)',
          display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500, marginTop: 2,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} />
          Online · Sri Lanka market
        </div>
      </div>
    </div>
  )
}
