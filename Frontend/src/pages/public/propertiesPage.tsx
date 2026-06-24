// // src/pages/public/PropertiesPage.tsx
// // ── Added: floating "+" button (bottom-right) → /admin/add-property ──────
// import { useMemo, useState, useEffect } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import { Search, Building2, Loader2, Plus } from 'lucide-react'
// import { Property } from '@/types/property'
// import { PropertyCard } from './components/propertyCard'

// const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

// const PRICE_RANGES = [
//   { label: 'Any price', min: 0, max: Infinity },
//   { label: 'Under 25M LKR', min: 0, max: 25_000_000 },
//   { label: '25M - 50M LKR', min: 25_000_000, max: 50_000_000 },
//   { label: '50M+ LKR', min: 50_000_000, max: Infinity },
// ]

// export default function PropertiesPage() {
//   const navigate = useNavigate()
//   const [properties, setProperties] = useState<Property[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [search, setSearch] = useState('')
//   const [priceRange, setPriceRange] = useState(0)

//   useEffect(() => {
//     async function fetchProperties() {
//       try {
//         setLoading(true)
//         setError(null)
//         const res = await fetch(`${BASE_URL}/properties?limit=100`)
//         if (!res.ok) throw new Error(`Failed to load properties: ${res.statusText}`)
//         const data = await res.json() as Property[]
//         setProperties(data)
//       } catch (err: unknown) {
//         console.error(err)
//         setError(err instanceof Error ? err.message : 'Failed to connect to server')
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchProperties()
//   }, [])

//   const filtered = useMemo(() => {
//     const range = PRICE_RANGES[priceRange]
//     const term = search.trim().toLowerCase()
//     return properties.filter(p => {
//       const matchesSearch =
//         !term ||
//         p.location.toLowerCase().includes(term) ||
//         p.title.toLowerCase().includes(term) ||
//         p.type.toLowerCase().includes(term)
//       const matchesPrice = p.price >= range.min && p.price <= range.max
//       return matchesSearch && matchesPrice
//     })
//   }, [properties, search, priceRange])

//   return (
//     <div className="min-h-screen bg-page text-slate-100">
//       {/* ── Top nav ─────────────────────────────────────────────── */}
//       <header className="border-b border-slate-800/80 bg-slate-950/95">
//         <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
//           <Link to="/" className="flex items-center gap-2">
//             <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-slate-950">
//               <Building2 size={16} />
//             </div>
//             <span className="text-base font-semibold text-white">LeadAI Properties</span>
//           </Link>
//           <nav className="flex items-center gap-6 text-sm text-slate-400">
//             <Link to="/" className="hover:text-white transition">Home</Link>
//             <Link to="/properties" className="text-white">Properties</Link>
//             <Link to="/login" className="hover:text-white transition">Sign in</Link>
//           </nav>
//         </div>
//       </header>

//       {/* ── Hero / search ───────────────────────────────────────── */}
//       <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
//         <h1 className="text-2xl font-semibold text-white sm:text-3xl">
//           Find your next home in Sri Lanka
//         </h1>
//         <p className="mt-2 text-sm text-slate-500">
//           Browse verified apartments, houses and land across Colombo, Kandy and beyond.
//         </p>

//         <div className="mt-6 flex flex-col gap-3 sm:flex-row">
//           <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
//             <Search size={16} className="text-slate-500" />
//             <input
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               placeholder="Search by location, e.g. Colombo 07"
//               className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
//             />
//           </div>
//           <select
//             value={priceRange}
//             onChange={e => setPriceRange(Number(e.target.value))}
//             className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none sm:w-48"
//           >
//             {PRICE_RANGES.map((r, i) => (
//               <option key={r.label} value={i}>{r.label}</option>
//             ))}
//           </select>
//         </div>

//         <p className="mt-6 text-xs uppercase tracking-widest text-slate-500">
//           {loading ? 'Searching...' : `${filtered.length} ${filtered.length === 1 ? 'property' : 'properties'} found`}
//         </p>

//         {loading ? (
//           <div className="mt-10 flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
//             <Loader2 size={32} className="animate-spin text-brand" />
//             <p className="text-sm">Loading properties...</p>
//           </div>
//         ) : error ? (
//           <div className="mt-10 rounded-2xl border border-dashed border-red-900 bg-red-950/20 p-10 text-center text-red-400">
//             {error}
//           </div>
//         ) : filtered.length === 0 ? (
//           <div className="mt-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center text-slate-500">
//             No properties match your search. Try a different location or price range.
//           </div>
//         ) : (
//           <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
//             {filtered.map(property => (
//               <PropertyCard key={property.id} property={property} />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ── Floating admin "Add property" button ──────────────────
//            Visible to everyone; the admin page itself is password-gated.
//            If you add real auth, wrap this in a role check instead.      */}
//       <button
//         onClick={() => navigate('/admin/add-property')}
//         title="Add property (admin)"
//         className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/50 transition hover:bg-indigo-500 active:scale-95 z-50"
//       >
//         <Plus size={18} />
//         <span className="hidden sm:inline">Add property</span>
//       </button>
//     </div>
//   )
// }

// src/pages/public/PropertiesPage.tsx
import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Building2, Loader2, Plus, Trash2, ShieldCheck, X } from 'lucide-react'
import { Property } from '@/types/property'
import { PropertyCard } from './components/propertyCard'
import { deleteProperty } from '@/app/be/adminProperty/[action]'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
const ADMIN_PASSWORD = 'admin123'

const PRICE_RANGES = [
  { label: 'Any price', min: 0, max: Infinity },
  { label: 'Under 25M LKR', min: 0, max: 25_000_000 },
  { label: '25M - 50M LKR', min: 25_000_000, max: 50_000_000 },
  { label: '50M+ LKR', min: 50_000_000, max: Infinity },
]

// ── Admin login modal ──────────────────────────────────────────────────────
function AdminLoginModal({ onAuth, onClose }: { onAuth: () => void; onClose: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)

  function check() {
    if (pw === ADMIN_PASSWORD) { onAuth() }
    else { setErr(true); setPw('') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-400" />
            <span className="text-sm font-semibold text-white">Admin access</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <X size={16} />
          </button>
        </div>
        <p className="mb-4 text-xs text-slate-500">Enter the admin password to manage listings.</p>
        <input
          type="password"
          value={pw}
          autoFocus
          onChange={e => { setPw(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Password"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500"
        />
        {err && <p className="mt-2 text-xs text-red-400">Incorrect password.</p>}
        <button
          onClick={check}
          className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ── Delete confirm modal ───────────────────────────────────────────────────
function DeleteModal({
  property, onConfirm, onCancel, deleting,
}: {
  property: Property; onConfirm: () => void; onCancel: () => void; deleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="mb-1 flex items-center gap-2">
          <Trash2 size={16} className="text-red-400" />
          <span className="text-sm font-semibold text-white">Delete property</span>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Are you sure you want to delete{' '}
          <span className="font-medium text-white">"{property.title}"</span>? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition disabled:opacity-60"
          >
            {deleting && <Loader2 size={13} className="animate-spin" />}
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [priceRange, setPriceRange] = useState(0)

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'delete'; property: Property } | null>(null)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchProperties() }, [])

  async function fetchProperties() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${BASE_URL}/properties?limit=100`)
      if (!res.ok) throw new Error(`Failed to load properties: ${res.statusText}`)
      const data = await res.json() as Property[]
      setProperties(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProperty(deleteTarget.id)
      setProperties(prev => prev.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete property.')
    } finally {
      setDeleting(false)
    }
  }

  // Card actions — gate on admin auth first if not yet logged in
  function handleCardEdit(property: Property) {
    if (isAdmin) {
      navigate(`/admin/add-property?id=${property.id}`)
    } else {
      setPendingAction({ type: 'edit', property })
      setShowAdminLogin(true)
    }
  }

  function handleCardDelete(property: Property) {
    if (isAdmin) {
      setDeleteTarget(property)
    } else {
      setPendingAction({ type: 'delete', property })
      setShowAdminLogin(true)
    }
  }

  // Called after a successful admin login — resumes whatever was clicked
  function handleAdminAuthed() {
    setIsAdmin(true)
    setShowAdminLogin(false)
    if (pendingAction) {
      if (pendingAction.type === 'edit') {
        navigate(`/admin/add-property?id=${pendingAction.property.id}`)
      } else {
        setDeleteTarget(pendingAction.property)
      }
      setPendingAction(null)
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
    <div className="min-h-screen bg-page text-slate-100">
      {/* Modals */}
      {showAdminLogin && (
        <AdminLoginModal
          onAuth={handleAdminAuthed}
          onClose={() => { setShowAdminLogin(false); setPendingAction(null) }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          property={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

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
            {isAdmin ? (
              <button
                onClick={() => setIsAdmin(false)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-800 bg-indigo-950/60 px-3 py-1.5 text-xs text-indigo-300 transition hover:bg-indigo-900/60"
              >
                <ShieldCheck size={12} /> Admin on
              </button>
            ) : (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="text-xs text-slate-500 transition hover:text-white"
              >
                Admin
              </button>
            )}
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

        {isAdmin && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-900/60 bg-indigo-950/30 px-4 py-2.5 text-xs text-indigo-300">
            <ShieldCheck size={13} /> Admin mode — use the ⋮ menu on any card to edit or delete it.
          </div>
        )}

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
                onEdit={handleCardEdit}
                onDelete={handleCardDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Floating Add property button (always visible) ────────── */}
      <button
        onClick={() => navigate('/admin/add-property')}
        title="Add property (admin)"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/50 transition hover:bg-indigo-500 active:scale-95"
      >
        <Plus size={18} />
        <span className="hidden sm:inline">Add property</span>
      </button>
    </div>
  )
}