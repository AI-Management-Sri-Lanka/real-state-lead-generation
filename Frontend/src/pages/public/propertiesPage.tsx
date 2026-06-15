// src/pages/public/PropertiesPage.tsx
//
// Public-facing property listing page. No auth required.
// Data source: src/data/properties.json (mock data — swap for
// `GET /properties` from your FastAPI backend later).
//
// Suggested route: <Route path="/properties" element={<PropertiesPage />} />

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Building2 } from 'lucide-react'
import propertiesData from '@/data/properties.json'
import { Property } from '@/types/property'
import { PropertyCard } from './components/propertyCard'

const properties = propertiesData as Property[]

const PRICE_RANGES = [
  { label: 'Any price', min: 0, max: Infinity },
  { label: 'Under 25M LKR', min: 0, max: 25_000_000 },
  { label: '25M - 50M LKR', min: 25_000_000, max: 50_000_000 },
  { label: '50M+ LKR', min: 50_000_000, max: Infinity },
]

export default function PropertiesPage() {
  const [search, setSearch] = useState('')
  const [priceRange, setPriceRange] = useState(0)

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
  }, [search, priceRange])

  return (
    <div className="min-h-screen bg-page text-slate-100">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-slate-950">
              <Building2 size={16} />
            </div>
            <span className="text-base font-semibold text-white">LeadAI Properties</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-slate-400">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <Link to="/properties" className="text-white">Properties</Link>
            <Link to="/login" className="hover:text-white transition">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero / search ───────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          Find your next home in Sri Lanka
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Browse verified apartments, houses and land across Colombo, Kandy and beyond.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
            <Search size={16} className="text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by location, e.g. Colombo 07"
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

        {/* ── Results count ─────────────────────────────────────── */}
        <p className="mt-6 text-xs uppercase tracking-widest text-slate-500">
          {filtered.length} {filtered.length === 1 ? 'property' : 'properties'} found
        </p>

        {/* ── Grid ───────────────────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center text-slate-500">
            No properties match your search. Try a different location or price range.
          </div>
        )}
      </div>
    </div>
  )
}