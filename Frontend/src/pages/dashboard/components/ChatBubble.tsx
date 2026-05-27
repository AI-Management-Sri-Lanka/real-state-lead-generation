// src/pages/dashboard/components/ChatBubble.tsx
import { Sparkles } from 'lucide-react'
import { Avatar }          from '@/components/ui/Avatar'
import { TypingIndicator } from '@/components/ui/TypingIndicator'
import { Message }         from '@/hooks/useChat'

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('• '))
      return <div key={i} style={{ display:'flex', gap:8, marginBottom:3 }}><span style={{ color:'var(--color-brand)', flexShrink:0 }}>•</span><span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>') }} /></div>
    if (line.trim()==='') return <div key={i} style={{ height:6 }} />
    return <p key={i} style={{ marginBottom:2 }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>') }} />
  })
}

interface Props { msg: Message; userName: string }

export function ChatBubble({ msg, userName }: Props) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display:'flex', gap:14, flexDirection: isUser ? 'row-reverse' : 'row', alignItems:'flex-start', animation:'fadeIn 0.2s ease-out' }}>
      {/* Avatar */}
      {isUser
        ? <Avatar name={userName} size={32} />
        : (
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#3D3BF3,#00C896)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Sparkles size={15} style={{ color:'white' }} />
          </div>
        )
      }

      {/* Bubble */}
      <div style={{ maxWidth:'72%' }}>
        {/* AI label badge — matches screenshot */}
        {!isUser && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:'var(--color-brand-light)', border:'1px solid rgba(61,59,243,0.15)', marginBottom:6 }}>
            <Sparkles size={12} style={{ color:'var(--color-brand)' }} />
            <span style={{ fontSize:11, fontWeight:600, color:'var(--color-brand)', fontFamily:'var(--font-sans)' }}>AI assistant</span>
          </div>
        )}
        <div style={{
          padding:'16px 20px', borderRadius: isUser ? '20px 6px 20px 20px' : '6px 20px 20px 20px',
          background: isUser ? 'linear-gradient(135deg,#3D3BF3,#5B5BFF)' : 'var(--color-surface)',
          border: isUser ? 'none' : '1px solid var(--color-border)',
          color: isUser ? 'white' : 'var(--color-text-primary)',
          fontSize:14, lineHeight:1.7, fontFamily:'var(--font-sans)',
          boxShadow: isUser ? '0 12px 30px rgba(61,59,243,0.18)' : '0 12px 30px rgba(3,13,33,0.07)',
        }}>
          {msg.isStreaming ? <TypingIndicator /> : <div>{renderContent(msg.content)}</div>}
          <div style={{ fontSize:11, marginTop:6, color: isUser ? 'rgba(255,255,255,0.6)' : 'var(--color-text-placeholder)', textAlign:'right' }}>
            {msg.timestamp.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
          </div>
        </div>
      </div>
    </div>
  )
}
