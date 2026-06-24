// src/pages/home/HomePage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Page: Home (Landing)
// Sections: Navbar, Hero, Features, HowItWorks, Pricing, Testimonials, CTA, Footer
// ─────────────────────────────────────────────────────────────────────────────
import { Navbar }              from './components/Navbar'
import { HeroSection }         from './components/HeroSection'
import { Footer }              from './components/Footer'
import { Link } from 'react-router-dom'


export default function HomePage() {
  return (
    <div className="home-root" style={{ minHeight:'100vh', fontFamily:'var(--font-sans)' }}>
      <Navbar />
      <HeroSection />
      <Link
  to="/properties"
  className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-500"
>
  Browse Properties
</Link>
      <Footer />
    </div>
  )
}
