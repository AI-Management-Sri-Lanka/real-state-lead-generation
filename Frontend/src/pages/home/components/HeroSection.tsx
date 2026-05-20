// src/pages/home/components/HeroSection.tsx
import { Link }     from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button }   from '@/components/ui/Button'

export function HeroSection() {
  return (
    <section style={{ background:'linear-gradient(160deg,#FAFAFF 0%,#F0F0FF 50%,#E6FAF5 100%)', padding:'96px 32px 80px', textAlign:'center', position:'relative', overflow:'hidden' }}>
      {/* Background circles */}
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(61,59,243,0.06) 0%,transparent 70%)', top:-200, left:'50%', transform:'translateX(-50%)', pointerEvents:'none' }} />

      <div style={{ maxWidth:760, margin:'0 auto', position:'relative', zIndex:1 }}>
        {/* Badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:40, background:'var(--color-brand-light)', border:'1px solid rgba(61,59,243,0.2)', marginBottom:28 }}>
          <Sparkles size={14} style={{ color:'var(--color-brand)' }} />
          <span style={{ fontSize:13, fontWeight:600, color:'var(--color-brand)', fontFamily:'var(--font-sans)' }}>AI-Powered Real Estate Platform</span>
        </div>

        <h1 style={{ fontSize:58, fontWeight:800, lineHeight:1.1, letterSpacing:'-0.04em', color:'var(--color-text-heading)', marginBottom:22, fontFamily:'var(--font-sans)' }}>
          Find your next{' '}
          <span style={{ background:'linear-gradient(135deg,#3D3BF3 0%,#00C896 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            property buyer
          </span>
          <br />with AI.
        </h1>

        <p style={{ fontSize:19, color:'var(--color-text-secondary)', lineHeight:1.7, maxWidth:560, margin:'0 auto 36px', fontFamily:'var(--font-sans)' }}>
          Automatically discover qualified leads from Facebook and Instagram using conversational AI — no manual searching required.
        </p>

        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Button variant="secondary" size="lg" style={{ height:54, fontSize:16, fontWeight:600, borderRadius:14, padding:'0 28px' }}>
              View demo
            </Button>
        </div>

      </div>
    </section>
  )
}
