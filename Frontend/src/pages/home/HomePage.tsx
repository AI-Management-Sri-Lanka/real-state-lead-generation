// src/pages/home/HomePage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Page: Home (Landing)
// Sections: Navbar, Hero, Features, HowItWorks, Pricing, Testimonials, CTA, Footer
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Navbar }              from './components/Navbar'
import { HeroSection, HeroSearchData } from './components/HeroSection'
import { Footer }              from './components/Footer'
import { PropertyCard }        from '@/components/properties/propertyCard'
import { propertyApi }         from '@/api/propertyApi'
import { Property }            from '@/types/property'

const CATEGORIES = ['All', 'Houses', 'Apartments', 'Condos', 'Commercial', 'Land', 'Luxury']

export default function HomePage() {
  
  // Featured grid state
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [heroSearch, setHeroSearch] = useState<HeroSearchData | null>(null)
  


  useEffect(() => {
    async function fetchFeatured() {
      try {
        setLoading(true)
        // Fetch latest 12 properties for the featured grid
        const data = await propertyApi.getProperties({ limit: 12 })
        setProperties(data)
      } catch (err) {
        console.error('Failed to load featured properties:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])



  const filteredProperties = useMemo(() => {
    let result = properties;

    if (activeCategory !== 'All') {
      const cat = activeCategory.toLowerCase()
      result = result.filter(p => {
        const type = (p.type || '').toLowerCase()
        if (cat === 'houses') return type.includes('house')
        if (cat === 'apartments') return type.includes('apartment')
        if (cat === 'condos') return type.includes('condo')
        if (cat === 'commercial') return type.includes('commercial')
        if (cat === 'land') return type.includes('land')
        if (cat === 'luxury') return p.price > 50000000 // naive luxury logic
        return type.includes(cat)
      })
    }

    if (heroSearch) {
      if (heroSearch.activeTab === 'FOR RENT') {
        result = result.filter(p => p.listingType?.toLowerCase() === 'rent')
      } else if (heroSearch.activeTab === 'FOR SALE') {
        result = result.filter(p => p.listingType?.toLowerCase() === 'sale')
      }

      if (heroSearch.keyword) {
        const kw = heroSearch.keyword.toLowerCase()
        result = result.filter(p => p.title.toLowerCase().includes(kw) || p.description?.toLowerCase().includes(kw))
      }

      if (heroSearch.propertyType) {
        result = result.filter(p => (p.type || '').toLowerCase() === heroSearch.propertyType.toLowerCase())
      }

      if (heroSearch.location) {
        const loc = heroSearch.location.toLowerCase()
        result = result.filter(p => (p.location || '').toLowerCase().includes(loc))
      }

      if (heroSearch.beds) {
        const minBeds = parseInt(heroSearch.beds, 10)
        if (!isNaN(minBeds)) {
          result = result.filter(p => (p.bedrooms || 0) >= minBeds)
        }
      }

      if (heroSearch.maxPrice) {
        const max = parseFloat(heroSearch.maxPrice)
        if (!isNaN(max)) {
          result = result.filter(p => p.price <= max)
        }
      }
    }

    return result
  }, [properties, activeCategory, heroSearch])
  return (
    <div className="home-root" style={{ minHeight:'100vh', fontFamily:'var(--font-sans)', background: 'var(--color-bg)' }}>
      <Navbar />
      <HeroSection onSearch={setHeroSearch} />

      <main id="properties-section" className="w-full px-4 pb-24 sm:px-6 lg:px-8 pt-8">
        


        {/* ── Category Chips ──────────────────────────────────────────── */}
        <div className="mb-8 mt-4 md:mt-0 overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  activeCategory === cat 
                    ? 'bg-[#37b754] text-white shadow-md' 
                    : 'bg-white/10 text-[color:var(--color-text-secondary)] border border-[color:var(--color-border)] hover:border-[color:var(--color-border)] hover:bg-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Featured Properties Header ──────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-text-heading)' }}>Featured Properties</h2>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Showing the newest listings</span>
        </div>

        {/* ── Property Grid ───────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <p className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>No featured properties found for this category.</p>
            <button onClick={() => setActiveCategory('All')} className="mt-2 font-semibold text-sm hover:underline" style={{ color: 'var(--color-brand)' }}>Clear filters</button>
          </div>
        )}

        {/* ── Secondary CTA ───────────────────────────────────────────── */}
        <div className="mt-16 flex justify-center">
          <Link
            to="/properties"
            className="group flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold shadow-sm border transition-all hover:shadow-md"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-heading)', borderColor: 'var(--color-border)' }}
          >
            View All Properties
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  )
}
