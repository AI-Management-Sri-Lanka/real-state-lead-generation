// src/components/ui/Avatar.tsx
interface AvatarProps { name?: string; src?: string; size?: number }
function initials(n: string) { return n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() }
export function Avatar({ name='User', src, size=32 }: AvatarProps) {
  if (src) return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover' }} />
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'linear-gradient(135deg,#3D3BF3,#00C896)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:600, color:'white', fontFamily:'var(--font-sans)', flexShrink:0, userSelect:'none' }}>
      {initials(name)}
    </div>
  )
}
