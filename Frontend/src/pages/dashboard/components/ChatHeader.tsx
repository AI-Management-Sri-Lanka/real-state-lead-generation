// src/pages/dashboard/components/ChatHeader.tsx
import { Sparkles } from 'lucide-react'

export function ChatHeader() {
  return (
    <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', gap:12, background:'var(--color-surface)' }}>
      <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#3D3BF3,#00C896)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(61,59,243,0.3)' }}>
        <Sparkles size={20} style={{ color:'white' }} />
      </div>
      <div>
        <div style={{ fontSize:15, fontWeight:700, color:'var(--color-text-heading)' }}>AI Lead Assistant</div>
        <div style={{ fontSize:12, color:'var(--color-success)', display:'flex', alignItems:'center', gap:5, fontWeight:500 }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--color-success)', display:'inline-block' }} />
          Online
        </div>
      </div>
    </div>
  )
}
