// src/pages/dashboard/components/ChatInput.tsx  — matches screenshot bottom bar
import { KeyboardEvent, useRef } from 'react'
import { Send, Mic, Square } from 'lucide-react'

interface Props {
  value:      string
  onChange:   (v: string) => void
  onSend:     () => void
  onStop:     () => void
  isLoading:  boolean
}

export function ChatInput({ value, onChange, onSend, onStop, isLoading }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() }
  }

  return (
    <div style={{ padding:'16px 24px 20px', borderTop:'1px solid var(--color-border)', background:'var(--color-surface)', display:'flex', alignItems:'center', gap:12 }}>
      {/* Mic button */}
      <button style={{ width:40, height:40, borderRadius:10, border:'1px solid var(--color-border)', background:'var(--color-surface)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-text-secondary)', flexShrink:0 }}>
        <Mic size={18} />
      </button>

      {/* Input — rounded pill matching screenshot */}
      <div style={{ flex:1, display:'flex', alignItems:'center', background:'var(--color-bg-muted)', border:'1.5px solid var(--color-border)', borderRadius:40, padding:'0 18px', transition:'border-color 0.15s' }}
        onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor='var(--color-brand)'}
        onBlurCapture={e  => (e.currentTarget as HTMLElement).style.borderColor='var(--color-border)'}
      >
        <input
          ref={ref} value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Describe your property and ideal buyer..."
          style={{ flex:1, height:48, background:'none', border:'none', outline:'none', fontSize:14, fontFamily:'var(--font-sans)', color:'var(--color-text-heading)' }}
        />
      </div>

      {/* Send / Stop button */}
      <button onClick={isLoading ? onStop : onSend} disabled={!isLoading && !value.trim()}
        style={{ width:44, height:44, borderRadius:12, border:'none', cursor: isLoading||value.trim() ? 'pointer' : 'default', background: isLoading ? '#EF4444' : 'linear-gradient(135deg,#3D3BF3,#5B5BFF)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, opacity: !isLoading&&!value.trim() ? 0.5 : 1, boxShadow:'0 2px 12px rgba(61,59,243,0.35)', transition:'all 0.15s' }}>
        {isLoading ? <Square size={18}/> : <Send size={18}/>}
      </button>
    </div>
  )
}
