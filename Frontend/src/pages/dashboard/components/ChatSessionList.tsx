// src/pages/dashboard/components/ChatSessionList.tsx
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ChatSession } from '@/hooks/useChat'

interface Props {
  sessions:    ChatSession[]
  onNew:       () => void
  onLoad:      (s: ChatSession) => void
}

export function ChatSessionList({ sessions, onNew, onLoad }: Props) {
  return (
    <div className="chat-session-list" style={{ width:220, minHeight:0, height:'100%', boxSizing:'border-box', borderRight:'1px solid var(--color-border)', display:'flex', flexDirection:'column', background:'var(--color-surface)' }}>
      {/* Recent chats header */}
      <div style={{ padding:'16px 16px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--color-text-heading)' }}>Recent chats</span>
        <button onClick={onNew} aria-label="New chat" style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--color-border)', background:'var(--color-surface)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-text-secondary)' }}>
          <Plus size={15} />
        </button>
      </div>

      {/* Session items */}
      <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:'0 8px', boxSizing:'border-box' }}>
        {sessions.length === 0 ? (
          <div style={{ padding:'8px 10px' }}>
            {/* Default sessions matching screenshot */}
            {['Colombo 3BR search','Nugegoda investors','Mt. Lavinia leads','Kandy apartment'].map((label, i) => (
              <button key={label}
                style={{ width:'100%', textAlign:'left', padding:'9px 12px', borderRadius:8, background: i===0 ? 'var(--color-nav-active-bg)' : 'transparent', border:'none', cursor:'pointer', fontSize:14, color: i===0 ? 'var(--color-brand)' : 'var(--color-text-secondary)', fontFamily:'var(--font-sans)', marginBottom:2, fontWeight: i===0 ? 500 : 400, transition:'all 0.1s' }}
                onMouseEnter={e => { if (i!==0) (e.currentTarget as HTMLElement).style.background='var(--color-bg-muted)' }}
                onMouseLeave={e => { if (i!==0) (e.currentTarget as HTMLElement).style.background='transparent' }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ padding:'0 8px' }}>
            {sessions.map(s => (
              <button key={s.id} onClick={() => onLoad(s)}
                style={{ width:'100%', textAlign:'left', padding:'9px 12px', borderRadius:8, background:'transparent', border:'none', cursor:'pointer', fontSize:14, color:'var(--color-text-secondary)', fontFamily:'var(--font-sans)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', transition:'all 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='var(--color-bg-muted)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div style={{ marginTop:'auto', padding:'12px 16px', borderTop:'1px solid var(--color-border)' }}>
        <p style={{ fontSize:11, color:'var(--color-text-placeholder)', lineHeight:1.5 }}>
          AI chat saves your search sessions automatically.
        </p>
      </div>
    </div>
  )
}
