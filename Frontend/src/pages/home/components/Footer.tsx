// src/pages/home/components/Footer.tsx
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { Github, Twitter, Linkedin } from 'lucide-react'

const LINKS = {
  Product:  ['Features','How it works','Pricing','Changelog'],
  Company:  ['About','Blog','Careers','Contact'],
  Legal:    ['Privacy Policy','Terms of Service','Cookie Policy'],
  Support:  ['Documentation','API Reference','Status','Help Center'],
}

export function Footer() {
  return (
    <footer className="site-footer" style={{ background:'var(--color-text-heading)', color:'rgba(255,255,255,0.7)', fontFamily:'var(--font-sans)', padding:'64px 32px 32px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:40, marginBottom:56 }}>
          {/* Brand column */}
          <div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#3D3BF3,#00C896)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="16" height="16" viewBox="0 0 22 22" fill="none"><path d="M11 3C7.13 3 4 6.13 4 10c0 2.45 1.27 4.61 3.18 5.88L6 19l3.28-1.09A7 7 0 1 0 11 3z" fill="white"/><circle cx="8.5" cy="10" r="1.2" fill="#3D3BF3"/><circle cx="11" cy="10" r="1.2" fill="#3D3BF3"/><circle cx="13.5" cy="10" r="1.2" fill="#3D3BF3"/></svg>
                </div>
                <span style={{ color:'white', fontWeight:700, fontSize:18 }}>LeadAI</span>
              </div>
            </div>
            <p style={{ fontSize:14, lineHeight:1.7, maxWidth:260, marginBottom:24 }}>
              AI-powered real estate lead generation. Find qualified buyers from social media, automatically.
            </p>
            <div style={{ display:'flex', gap:12 }}>
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a key={i} href="#" style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.7)', textDecoration:'none', transition:'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.color='white' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.7)' }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <div style={{ fontSize:13, fontWeight:600, color:'white', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:16 }}>{heading}</div>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
                {items.map(item => (
                  <li key={item}>
                    <a href="#" style={{ fontSize:14, color:'rgba(255,255,255,0.6)', textDecoration:'none', transition:'color 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='white'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.6)'}
                    >{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>© 2026 LeadAI. All rights reserved.</span>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>Built for real estate agents in Sri Lanka 🇱🇰</span>
        </div>
      </div>
    </footer>
  )
}
