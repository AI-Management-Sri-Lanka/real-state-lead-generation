// src/components/dashboard/StatsCard.tsx
import PropTypes from 'prop-types'
import type { ReactNode } from 'react'

type StatsCardType = {
  label?:         string
  value?:         string | number
  trend?:         string
  trendPositive?: boolean
  accentLabel?:   string
  icon?:          ReactNode
}

type StatsCardProps = {
  card?:      StatsCardType
  isLoading?: boolean
}

export function StatsCard({ card = {}, isLoading = false }: StatsCardProps) {
  return (
    /*
     * FIX: removed `h-full` and `justify-between` from the inner div.
     * Those two classes caused the card to stretch to the full row height
     * and push trend text to the bottom. Cards now size to their content.
     *
     * Also reduced padding from p-6 → p-5 so cards feel compact at 2-col
     * layout on smaller screens, and icon size from h-14 w-14 → h-11 w-11.
     */
    <div className="overflow-hidden rounded-[24px] border border-slate-800/80 bg-slate-950/90 p-5 shadow-panel">
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-20 rounded-full bg-slate-800" />
          <div className="h-8 w-3/4 rounded-xl bg-slate-800" />
          <div className="h-3 w-1/2 rounded-full bg-slate-800" />
        </div>
      ) : (
        /* FIX: `flex-col gap-4` with NO h-full — card shrinks to content */
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.20em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white">
                {card.value}
              </p>
            </div>
            {/* FIX: icon box reduced h-14 w-14 → h-11 w-11 */}
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900">
              {card.icon}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs font-medium">
            <span className={card.trendPositive ? 'text-emerald-400' : 'text-red-400'}>
              {card.trendPositive ? '↑' : '↓'} {card.trend}
            </span>
            <span className="rounded-full bg-slate-900 px-2.5 py-1 uppercase tracking-[0.16em] text-slate-500">
              {card.accentLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

StatsCard.propTypes = {
  card: PropTypes.shape({
    label:         PropTypes.string,
    value:         PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    trend:         PropTypes.string,
    trendPositive: PropTypes.bool,
    accentLabel:   PropTypes.string,
    icon:          PropTypes.node,
  }),
  isLoading: PropTypes.bool,
}

StatsCard.defaultProps = {
  card:      {},
  isLoading: false,
}
