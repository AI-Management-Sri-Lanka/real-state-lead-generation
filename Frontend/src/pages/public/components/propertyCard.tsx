// src/pages/public/components/PropertyCard.tsx
import { useNavigate } from 'react-router-dom'
import { BedDouble, Bath, Ruler, MapPin, BadgeCheck } from 'lucide-react'
import { Property } from '@/types/property'

interface Props {
  property: Property
}

function formatPrice(price: number, currency: string, listingType: string) {
  const formatted = price.toLocaleString('en-US')
  return listingType === 'Rent' ? `${formatted} ${currency} / month` : `${formatted} ${currency}`
}

export function PropertyCard({ property }: Props) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/properties/${property.id}`)}
      className="cursor-pointer overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/90 transition hover:border-indigo-500/60 hover:bg-slate-900"
    >
      {/* Image placeholder */}
      <div className="flex h-36 items-center justify-center bg-slate-900 text-slate-600">
        <MapPin size={28} />
      </div>

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

        {/* Specs row — land has no beds/baths */}
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1"><BedDouble size={13} /> {property.bedrooms} bed</span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1"><Bath size={13} /> {property.bathrooms} bath</span>
          )}
          {property.areaSqft != null && (
            <span className="flex items-center gap-1"><Ruler size={13} /> {property.areaSqft} sqft</span>
          )}
          {property.landSizePerches != null && (
            <span className="flex items-center gap-1"><Ruler size={13} /> {property.landSizePerches} perches</span>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-indigo-950/60 px-2.5 py-1 text-[11px] font-medium text-indigo-300">
            {property.type}
          </span>
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
            For {property.listingType}
          </span>
        </div>
      </div>
    </div>
  )
}