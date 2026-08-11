import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import { Property } from '@/types/property'
import { PropertyCard } from '@/components/properties/propertyCard'
import { propertyApi } from '@/api/propertyApi'

import { Navbar } from '@/pages/home/components/Navbar'
import { Footer } from '@/pages/home/components/Footer'

const PRICE_RANGES = [
  { label: 'Any price', min: 0, max: Infinity },
  { label: 'Under 25M', min: 0, max: 25_000_000 },
  { label: '25M - 50M', min: 25_000_000, max: 50_000_000 },
  { label: '50M+', min: 50_000_000, max: Infinity },
]

// ── Main page ──────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [priceRange, setPriceRange] = useState(0)

  useEffect(() => { fetchProperties() }, [])

  async function fetchProperties() {
    try {
      setLoading(true)
      setError(null)
      const data = await propertyApi.getProperties({ limit: 100 })
      setProperties(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const range = PRICE_RANGES[priceRange]
    const term = search.trim().toLowerCase()
    return properties.filter(p => {
      const matchesSearch =
        !term ||
        p.location.toLowerCase().includes(term) ||
        p.title.toLowerCase().includes(term) ||
        p.type.toLowerCase().includes(term)
      const matchesPrice = p.price >= range.min && p.price <= range.max
      return matchesSearch && matchesPrice
    })
  }, [properties, search, priceRange])

  return (
    <div className="min-h-screen w-full bg-page text-slate-100 flex flex-col">
      <Navbar />

      {/* ── Hero / search ───────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-6xl flex-1 box-border px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          Find your next home
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Browse verified apartments, houses and land in top locations.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
            <Search size={16} className="text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Title, Location, Property Type"
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
            />
          </div>
          <select
            value={priceRange}
            onChange={e => setPriceRange(Number(e.target.value))}
            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none sm:w-48"
          >
            {PRICE_RANGES.map((r, i) => (
              <option key={r.label} value={i}>{r.label}</option>
            ))}
          </select>
        </div>

        <p className="mt-6 text-xs uppercase tracking-widest text-slate-500">
          {loading ? 'Searching...' : `${filtered.length} ${filtered.length === 1 ? 'property' : 'properties'} found`}
        </p>

        {loading ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
            <Loader2 size={32} className="animate-spin text-brand" />
            <p className="text-sm">Loading properties...</p>
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-dashed border-red-900 bg-red-950/20 p-10 text-center text-red-400">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center text-slate-500">
            No properties match your search.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}