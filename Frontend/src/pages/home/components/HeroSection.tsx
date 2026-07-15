// src/pages/home/components/HeroSection.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const HERO_IMAGES = [
  '/images/hero/hero-1.webp',
  '/images/hero/hero-2.webp',
  '/images/hero/hero-3.webp',
  '/images/hero/hero-4.webp'
]

export interface HeroSearchData {
  activeTab: string
  keyword: string
  propertyType: string
  location: string
  beds: string
  maxPrice: string
}

interface HeroSectionProps {
  onSearch?: (data: HeroSearchData) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const navigate = useNavigate()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Search form state
  const [activeTab, setActiveTab] = useState('ALL')
  const [keyword, setKeyword] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [location, setLocation] = useState('')
  const [beds, setBeds] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  // Carousel effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Live search effect
  useEffect(() => {
    if (onSearch) {
      onSearch({ activeTab, keyword, propertyType, location, beds, maxPrice })
    }
  }, [activeTab, keyword, propertyType, location, beds, maxPrice, onSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      // Just scroll to results if on the same page
      document.getElementById('properties-section')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/properties?location=${encodeURIComponent(location)}`)
    }
  }

  return (
    <section className="relative w-full h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Images Carousel */}
      {HERO_IMAGES.map((img, index) => (
        <div
          key={img}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={img}
            alt="Premium Real Estate"
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      ))}
      
      {/* Top Gradient Overlay to protect Navbar contrast against bright images */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none"></div>

      {/* Content */}
      <div className="hero-text-preserve relative z-10 w-full max-w-5xl px-4 mx-auto text-center">
        <h1 className="hero-no-override text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-md text-[#ffffff]">
          Find Your Dream Home
        </h1>
        <p className="hero-no-override text-xs md:text-sm font-bold tracking-[0.2em] mb-10 uppercase drop-shadow-sm text-[rgba(255,255,255,0.9)]">
          Apartments &bull; Houses &bull; Commercial &bull; Land
        </p>

        {/* Search Widget */}
        <div className="mx-auto max-w-4xl">
          {/* Tabs */}
          <div className="flex justify-center mb-4 space-x-2">
            {['ALL', 'FOR RENT', 'FOR SALE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  color: 'white',
                  background: activeTab === tab ? '#37b754' : 'rgba(0,0,0,0.5)',
                }}
                className={`px-8 py-2 rounded-full text-xs font-bold transition-colors tracking-wide backdrop-blur-sm`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Form */}
          <form 
            onSubmit={handleSearch}
            className="bg-black/40 backdrop-blur-md p-2 rounded-3xl md:rounded-full border border-white/20 shadow-2xl flex flex-col md:flex-row items-center gap-2"
          >
            <div className="w-full md:w-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
              <input
                type="text"
                placeholder="Enter a keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                style={{ color: '#1e293b', background: 'white' }}
              className="col-span-1 sm:col-span-2 text-sm px-4 py-3.5 rounded-2xl md:rounded-full outline-none focus:ring-2 focus:ring-[#37b754]"
            />
              <select 
                value={propertyType} 
                onChange={(e) => setPropertyType(e.target.value)}
                style={{ color: '#374151', background: 'white' }}
                className="text-sm px-4 py-3.5 rounded-2xl md:rounded-full outline-none focus:ring-2 focus:ring-[#37b754] cursor-pointer"
              >
                <option value="">Type</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Commercial">Commercial</option>
                <option value="Land">Land</option>
              </select>
              <input
                type="text"
                placeholder="Where"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ color: '#1e293b', background: 'white' }}
                className="text-sm px-4 py-3.5 rounded-2xl md:rounded-full outline-none focus:ring-2 focus:ring-[#37b754]"
              />
              <select 
                value={beds} 
                onChange={(e) => setBeds(e.target.value)}
                style={{ color: '#374151', background: 'white' }}
                className="text-sm px-4 py-3.5 rounded-2xl md:rounded-full outline-none focus:ring-2 focus:ring-[#37b754] cursor-pointer"
              >
                <option value="">Beds</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
              <select 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ color: '#374151', background: 'white' }}
                className="text-sm px-4 py-3.5 rounded-2xl md:rounded-full outline-none focus:ring-2 focus:ring-[#37b754] cursor-pointer"
              >
                <option value="">Max Price</option>
                <option value="25000000">25M</option>
                <option value="50000000">50M</option>
                <option value="100000000">100M</option>
              </select>
            </div>
            
            <button 
              type="submit"
              style={{ color: 'white', background: '#37b754' }}
              className="w-full md:w-auto px-10 py-3.5 rounded-2xl md:rounded-full font-bold text-sm transition-colors shadow-lg shadow-[#37b754]/30 whitespace-nowrap hover:opacity-90"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
