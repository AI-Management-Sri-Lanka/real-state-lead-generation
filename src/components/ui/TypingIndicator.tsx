// src/components/ui/TypingIndicator.tsx
export function TypingIndicator() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 0' }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--color-brand)', display:'inline-block', animation:`pulse-dot 1.2s ease-in-out ${i*0.2}s infinite` }} />
      ))}
    </div>
  )
}
