// src/pages/home/HomePage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Page: Home (Landing)
// Sections: Navbar, Hero, Features, HowItWorks, Pricing, Testimonials, CTA, Footer
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import { Navbar }              from './components/Navbar'
import { HeroSection }         from './components/HeroSection'
import { Footer }              from './components/Footer'
import { PropertyCard }        from '@/components/properties/propertyCard'
import { propertyApi }         from '@/api/propertyApi'
import { Property }            from '@/types/property'

const CATEGORIES = ['All', 'Houses', 'Apartments', 'Condos', 'Commercial', 'Land', 'Luxury']

export default function HomePage() {
  const navigate = useNavigate()
  
  // Featured grid state
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  
  // Quick search state
  const [location, setLocation] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [bedrooms, setBedrooms] = useState('')

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

  const handleSearch = () => {
    // Navigate to properties page with search parameters (basic implementation)
    // The properties page might need query param handling later, but this gets them there.
    navigate(`/properties?location=${encodeURIComponent(location)}`)
  }

  const filteredProperties = useMemo(() => {
    if (activeCategory === 'All') return properties
    // Map category names to property types used in the DB
    const cat = activeCategory.toLowerCase()
    return properties.filter(p => {
      const type = p.type.toLowerCase()
      if (cat === 'houses') return type.includes('house')
      if (cat === 'apartments') return type.includes('apartment')
      if (cat === 'condos') return type.includes('condo')
      if (cat === 'commercial') return type.includes('commercial')
      if (cat === 'land') return type.includes('land')
      if (cat === 'luxury') return p.price > 50000000 // naive luxury logic
      return type.includes(cat)
    })
  }, [properties, activeCategory])
  return (
    <div className="home-root" style={{ minHeight:'100vh', fontFamily:'var(--font-sans)', background: 'var(--color-bg)' }}>
      <Navbar />
      <HeroSection />

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        
        {/* ── Quick Search ────────────────────────────────────────────── */}
        <div className="relative -mt-8 mb-12 rounded-2xl bg-white p-4 shadow-xl shadow-indigo-500/10 border border-slate-100 z-10 hidden md:block">
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search Location..." 
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500">
              <option value="">Property Type</option>
              <option value="House">House</option>
              <option value="Apartment">Apartment</option>
              <option value="Land">Land</option>
            </select>
            <select value={priceRange} onChange={e => setPriceRange(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500">
              <option value="">Price Range</option>
              <option value="0-25M">Under 25M</option>
              <option value="25M-50M">25M - 50M</option>
              <option value="50M+">50M+</option>
            </select>
            <button 
              onClick={handleSearch}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3 px-4 transition-colors text-sm shadow-md shadow-indigo-200"
            >
              Search
            </button>
          </div>
        </div>

        {/* ── Category Chips ──────────────────────────────────────────── */}
        <div className="mb-8 mt-4 md:mt-0 overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  activeCategory === cat 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Featured Properties Header ──────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Featured Properties</h2>
          <span className="text-sm font-medium text-slate-500">Showing the newest listings</span>
        </div>

        {/* ── Property Grid ───────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">No featured properties found for this category.</p>
            <button onClick={() => setActiveCategory('All')} className="mt-2 text-indigo-600 hover:underline font-semibold text-sm">Clear filters</button>
          </div>
        )}

        {/* ── Secondary CTA ───────────────────────────────────────────── */}
        <div className="mt-16 flex justify-center">
          <Link
            to="/properties"
            className="group flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-slate-900 shadow-sm border border-slate-200 transition-all hover:border-slate-300 hover:shadow-md hover:bg-slate-50"
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
