// // src/pages/public/components/propertyCard.tsx
// import { useNavigate } from 'react-router-dom'
// import { BedDouble, Bath, Ruler, MapPin, BadgeCheck, Pencil, Trash2 } from 'lucide-react'
// import { Property } from '@/types/property'

// interface Props {
//   property: Property
//   isAdmin?: boolean
//   onEdit?: (property: Property) => void
//   onDelete?: (property: Property) => void
// }

// function formatPrice(price: number, currency: string, listingType: string) {
//   const formatted = price.toLocaleString('en-US')
//   return listingType === 'Rent' ? `${formatted} ${currency} / month` : `${formatted} ${currency}`
// }

// export function PropertyCard({ property, isAdmin, onEdit, onDelete }: Props) {
//   const navigate = useNavigate()

//   return (
//     <div
//       onClick={() => navigate(`/properties/${property.id}`)}
//       className="cursor-pointer overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/90 transition hover:border-indigo-500/60 hover:bg-slate-900 relative group"
//     >
//       {/* ── Admin action buttons (visible on hover when isAdmin) ── */}
//       {isAdmin && (
//         <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
//           <button
//             onClick={e => { e.stopPropagation(); onEdit?.(property) }}
//             title="Edit property"
//             className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/95 text-slate-300 transition hover:border-indigo-500 hover:text-white"
//           >
//             <Pencil size={13} />
//           </button>
//           <button
//             onClick={e => { e.stopPropagation(); onDelete?.(property) }}
//             title="Delete property"
//             className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/95 text-slate-300 transition hover:border-red-500 hover:text-red-400"
//           >
//             <Trash2 size={13} />
//           </button>
//         </div>
//       )}

//       {/* ── Image / placeholder ───────────────────────────────── */}
//       {property.images && property.images.length > 0 ? (
//         <div className="h-36 w-full overflow-hidden bg-slate-900">
//           <img
//             src={property.images[0]}
//             alt={property.title}
//             className="h-full w-full object-cover transition duration-300 hover:scale-105"
//           />
//         </div>
//       ) : (
//         <div className="flex h-36 items-center justify-center bg-slate-900 text-slate-600">
//           <MapPin size={28} />
//         </div>
//       )}

//       <div className="p-4">
//         <div className="flex items-start justify-between gap-2">
//           <p className="text-base font-semibold text-white">
//             {formatPrice(property.price, property.currency, property.listingType)}
//           </p>
//           {property.verified && (
//             <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
//               <BadgeCheck size={12} /> Verified
//             </span>
//           )}
//         </div>

//         <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
//           <MapPin size={12} /> {property.location}
//         </p>

//         <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
//           {property.bedrooms != null && (
//             <span className="flex items-center gap-1"><BedDouble size={13} /> {property.bedrooms} bed</span>
//           )}
//           {property.bathrooms != null && (
//             <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms} bath</span>
//           )}
//           {property.areaSqft != null && (
//             <span className="flex items-center gap-1"><Ruler size={13} /> {property.areaSqft} sqft</span>
//           )}
//           {property.landSizePerches != null && (
//             <span className="flex items-center gap-1"><Ruler size={13} /> {property.landSizePerches} perches</span>
//           )}
//         </div>

//         <div className="mt-3 flex gap-2">
//           <span className="rounded-full bg-indigo-950/60 px-2.5 py-1 text-[11px] font-medium text-indigo-300">
//             {property.type}
//           </span>
//           <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
//             For {property.listingType}
//           </span>
//         </div>
//       </div>
//     </div>
//   )
// }

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BedDouble, Bath, Ruler, MapPin, BadgeCheck, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Property } from '@/types/property'

interface Props {
  property: Property
  onEdit?: (property: Property) => void
  onDelete?: (property: Property) => void
}

function formatPrice(price: number, currency: string, listingType: string) {
  const formatted = price.toLocaleString('en-US')
  return listingType === 'Rent' ? `${formatted} ${currency} / month` : `${formatted} ${currency}`
}

export function PropertyCard({ property, onEdit, onDelete }: Props) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
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
      onClick={() => navigate(`/properties/${property.id}`)}
      className="cursor-pointer overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/90 transition hover:border-indigo-500/60 hover:bg-slate-900 relative"
    >
      {/* ── Three-dot menu ───────────────────────────────────── */}
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
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(false); onEdit?.(property) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete?.(property) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 transition hover:bg-red-950/40"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* ── Image / placeholder ─────────────────────────────── */}
      {property.images && property.images.length > 0 ? (
        <div className="h-36 w-full overflow-hidden bg-slate-900">
          <img src={property.images[0]} alt={property.title} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
        </div>
      ) : (
        <div className="flex h-36 items-center justify-center bg-slate-900 text-slate-600">
          <MapPin size={28} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-semibold text-white">
            {formatPrice(property.price, property.currency, property.listingType)}
          </p>
          {property.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <BadgeCheck size={12} /> Verified
            </span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} /> {property.location}
        </p>

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          {property.bedrooms != null && <span className="flex items-center gap-1"><BedDouble size={13} /> {property.bedrooms} bed</span>}
          {property.bathrooms != null && <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms} bath</span>}
          {property.areaSqft != null && <span className="flex items-center gap-1"><Ruler size={13} /> {property.areaSqft} sqft</span>}
          {property.landSizePerches != null && <span className="flex items-center gap-1"><Ruler size={13} /> {property.landSizePerches} perches</span>}
        </div>

        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-indigo-950/60 px-2.5 py-1 text-[11px] font-medium text-indigo-300">{property.type}</span>
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">For {property.listingType}</span>
        </div>
      </div>
    </div>
  )
}