// src/components/ui/Logo.tsx
interface LogoProps { size?: 'sm'|'md'|'lg'; showText?: boolean; whiteText?: boolean }
const px  = { sm:24, md:30, lg:38 }
const tx  = { sm:16, md:19, lg:24 }

export function Logo({ size='md', showText=true, whiteText=false }: LogoProps) {
  const s = px[size]; const t = tx[size]
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, userSelect:'none' }}>
      <div style={{ width:s, height:s, borderRadius:Math.round(s*0.28), background:'linear-gradient(135deg,#3D3BF3 0%,#00C896 100%)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(61,59,243,0.3)', flexShrink:0 }}>
        <svg width={s*0.55} height={s*0.55} viewBox="0 0 22 22" fill="none">
          <path d="M11 3C7.13 3 4 6.13 4 10c0 2.45 1.27 4.61 3.18 5.88L6 19l3.28-1.09A7 7 0 1 0 11 3z" fill="white" fillOpacity={0.95}/>
          <circle cx="8.5" cy="10" r="1.2" fill="white"/>
          <circle cx="11"  cy="10" r="1.2" fill="white"/>
          <circle cx="13.5" cy="10" r="1.2" fill="white"/>
        </svg>
      </div>
      {showText && (
        <span style={{ fontFamily:'var(--font-sans)', fontSize:t, fontWeight:700, letterSpacing:'-0.02em', color: whiteText ? '#ffffff' : 'var(--color-text-heading)' }}>
          Lead<span style={{ color:'var(--color-brand)' }}>AI</span>
        </span>
      )}
    </div>
  )
}
