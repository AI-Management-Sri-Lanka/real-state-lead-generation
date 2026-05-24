// src/pages/dashboard/components/ChatSessionList.tsx
import { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2, MessageSquare } from 'lucide-react'
import { ChatSession } from '@/hooks/useChat'

interface Props {
  sessions: ChatSession[]
  onNew:    () => void
  onLoad:   (s: ChatSession) => void
}

// Placeholder sessions shown when the user has no history yet
const PLACEHOLDER_SESSIONS = [
  { id: 'p1', label: 'Colombo 3BR search', isActive: true  },
  { id: 'p2', label: 'Nugegoda investors',  isActive: false },
  { id: 'p3', label: 'Mt. Lavinia leads',   isActive: false },
  { id: 'p4', label: 'Kandy apartment',     isActive: false },
]

export function ChatSessionList({ sessions, onNew, onLoad }: Props) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const hasRealSessions = sessions.length > 0

  return (
    /*
     * RESPONSIVE FIX:
     * - Removed hardcoded `width:240` — width is controlled by the parent aside
     * - height:'100%' kept so it fills the sidebar slot correctly
     * - overflow-y:auto on session list so long histories scroll inside
     */
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
        padding: '16px 12px',
        gap: 12,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 4px' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Chats
        </span>
        <button
          onClick={onNew}
          aria-label="Start new chat"
          title="New chat"
          style={{
            width: 30, height: 30, borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-secondary)',
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-brand)'
            ;(e.currentTarget as HTMLElement).style.color = 'white'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)'
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* ── Session list ─────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: '2px 0',
        }}
      >
        {/* Timestamps group label */}
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-placeholder)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 8px 6px' }}>
          {hasRealSessions ? 'Today' : 'Recent'}
        </p>

        {!hasRealSessions
          // ── Placeholder rows (no real sessions yet) ──
          ? PLACEHOLDER_SESSIONS.map(s => (
              <div
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: s.isActive ? 'var(--color-nav-active-bg)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!s.isActive) (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-muted)' }}
                onMouseLeave={e => { if (!s.isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <MessageSquare size={13} style={{ color: s.isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)', flexShrink: 0 }} />
                <span style={{
                  fontSize: 13, fontWeight: s.isActive ? 500 : 400,
                  color: s.isActive ? 'var(--color-brand)' : 'var(--color-text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {s.label}
                </span>
              </div>
            ))
          // ── Real session rows ──
          : sessions.map(s => (
              <div
                key={s.id}
                style={{ position: 'relative' }}
                onMouseLeave={() => setMenuOpen(null)}
              >
                <button
                  onClick={() => onLoad(s)}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    overflow: 'hidden',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-muted)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <MessageSquare size={13} style={{ flexShrink: 0, color: 'var(--color-text-placeholder)' }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </span>
                  {/* Kebab menu trigger */}
                  <span
                    role="button"
                    aria-label="Session options"
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === s.id ? null : s.id) }}
                    style={{
                      flexShrink: 0, padding: '2px', borderRadius: 6,
                      color: 'var(--color-text-placeholder)',
                      display: 'flex', alignItems: 'center',
                      transition: 'color 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text-heading)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text-placeholder)'}
                  >
                    <MoreHorizontal size={14} />
                  </span>
                </button>

                {/* Dropdown */}
                {menuOpen === s.id && (
                  <div style={{
                    position: 'absolute', right: 4, top: '100%', zIndex: 50,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10, overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                    minWidth: 140,
                  }}>
                    {[
                      { icon: Pencil,  label: 'Rename',  action: () => {} },
                      { icon: Trash2,  label: 'Delete',  action: () => {}, danger: true },
                    ].map(item => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.label}
                          onClick={item.action}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '9px 14px',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            fontSize: 13, fontFamily: 'var(--font-sans)',
                            color: item.danger ? '#f87171' : 'var(--color-text-secondary)',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-muted)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                        >
                          <Icon size={13} />
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))
        }
      </div>

      {/* ── Footer hint ───────────────────────────────────────────── */}
      <div style={{
        padding: '12px 8px 4px',
        borderTop: '1px solid var(--color-border)',
      }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-placeholder)', lineHeight: 1.6, margin: 0 }}>
          Chat sessions save automatically.
        </p>
      </div>
    </div>
  )
}
