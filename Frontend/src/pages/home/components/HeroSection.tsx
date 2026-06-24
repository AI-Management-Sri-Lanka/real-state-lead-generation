// src/pages/home/components/HeroSection.tsx
import { Link }     from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button }   from '@/components/ui/Button'

export function HeroSection() {
  return (
    <section className="hero-section" style={{ background:'var(--color-hero-bg)', padding:'96px 32px 80px', textAlign:'center', position:'relative', overflow:'hidden' }}>
      {/* Background circles */}
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'var(--color-hero-circle)', top:-200, left:'50%', transform:'translateX(-50%)', pointerEvents:'none' }} />

      <div style={{ maxWidth:760, margin:'0 auto', position:'relative', zIndex:1 }}>
        {/* Badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:40, background:'var(--color-hero-badge-bg)', border:'1px solid var(--color-hero-badge-border)', marginBottom:28 }}>
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

        {/* Button removed per design update */}
        <div style={{ height: 1, marginTop: 10 }} />

      </div>
    </section>
  )
}
