import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BedDouble, Bath, Ruler, MapPin, BadgeCheck, MoreVertical, Pencil, Trash2, Heart } from 'lucide-react'
import { Property, getCoverImageUrl } from '@/types/property'

interface Props {
  property: Property
  onEdit?: (property: Property) => void
  onDelete?: (property: Property) => void
}

function formatPrice(price: number, currency: string, listingType: string) {
  const formatted = price.toLocaleString('en-US')
  return listingType === 'Rent' ? `${formatted} ${currency} / month` : `${formatted} ${currency}`
}

function getTypeBadgeStyles(type: string) {
  const t = type?.toLowerCase()
  if (t === 'apartment') return 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
  if (t === 'house') return 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
  if (t === 'land') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  if (t === 'commercial') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
}

export function PropertyCard({ property, onEdit, onDelete }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [favorite, setFavorite] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [menuOpen])

  return (
    <div
      onClick={() => navigate(`/properties/${property.id}`, { state: { from: location.pathname } })}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/90 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/60 hover:bg-slate-900 relative"
    >
      {/* ── Three-dot menu ───────────────────────────────────── */}
      {(onEdit || onDelete) && (
        <div ref={menuRef} className="absolute top-2 right-2 z-10">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            title="Options"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/95 text-slate-300 transition hover:border-indigo-500 hover:text-white"
          >
            <MoreVertical size={14} />
          </button>
  
          {menuOpen && (
            <div className="absolute right-0 top-9 w-32 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
              {onEdit && (
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit(property) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(property) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition hover:bg-red-950/40"
                >
                  <Trash2 size={12} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Favorite Button (Public View) ───────────────────────── */}
      {!onEdit && !onDelete && (
        <button
          onClick={e => {
            e.stopPropagation()
            setFavorite(!favorite)
          }}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/40 backdrop-blur-md border border-white/20 text-white transition-all hover:scale-110 hover:bg-rose-500/90"
        >
          <Heart size={15} fill={favorite ? 'currentColor' : 'none'} className={favorite ? 'text-rose-500 hover:text-white' : ''} />
        </button>
      )}

      {/* ── Image / placeholder ─────────────────────────────── */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        {getCoverImageUrl(property.images) ? (
          <img src={getCoverImageUrl(property.images)!} alt={property.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600">
            <MapPin size={28} />
          </div>
        )}
        
        {/* View Details Overlay */}
        <div className="absolute inset-0 bg-slate-950/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center pointer-events-none">
          <span className="rounded-full bg-indigo-600/90 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white shadow-xl transform translate-y-4 transition-transform duration-300 group-hover:translate-y-0">
            View Details
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-semibold text-white">
            {formatPrice(property.price, property.currency, property.listingType)}
          </p>
          {property.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              <BadgeCheck size={12} /> Verified
            </span>
          )}
        </div>

        {property.title && (
          <p className="mt-1.5 text-sm font-medium text-slate-200 line-clamp-1" title={property.title}>
            {property.title}
          </p>
        )}

        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} /> {property.location}
        </p>

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          {property.bedrooms != null && <span className="flex items-center gap-1"><BedDouble size={13} /> {property.bedrooms} bed</span>}
          {property.bathrooms != null && <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms} bath</span>}
          {property.areaSqft != null && <span className="flex items-center gap-1"><Ruler size={13} /> {property.areaSqft} sqft</span>}
          {property.landSizePerches != null && <span className="flex items-center gap-1"><Ruler size={13} /> {property.landSizePerches} perches</span>}
        </div>

        <div className="mt-4 flex gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${getTypeBadgeStyles(property.type)}`}>
            {property.type}
          </span>
        </div>
      </div>
    </div>
  )
}