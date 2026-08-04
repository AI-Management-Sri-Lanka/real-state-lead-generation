import PropTypes from 'prop-types'
import { CheckCircle2, AlertTriangle, Slash } from 'lucide-react'

const scoreMeta = {
  High: { label: 'High', icon: CheckCircle2, color: 'bg-emerald-500 text-emerald-100' },
  Medium: { label: 'Medium', icon: AlertTriangle, color: 'bg-amber-500 text-amber-100' },
  Low: { label: 'Low', icon: Slash, color: 'bg-red-500 text-red-100' },
} as const

type LeadScore = keyof typeof scoreMeta

type Lead = {
  initials: string
  name: string
  location: string
  amount: string
  score: LeadScore
}

type LeadItemProps = {
  lead: Lead
  onSelect?: (lead: Lead) => void
  isActive?: boolean
}

export function LeadItem({ lead, onSelect, isActive = false }: LeadItemProps) {
  const score = scoreMeta[lead.score] || scoreMeta.Low
  const ScoreIcon = score.icon

  return (
    <button
      type="button"
      onClick={() => onSelect?.(lead)}
      className={`group flex w-full items-center justify-between gap-4 rounded-[24px] border border-sky-200/80 bg-white/70 px-4 py-4 text-left transition hover:border-sky-400 hover:bg-sky-50/80 dark:border-slate-800/90 dark:bg-slate-950/90 dark:hover:border-brand dark:hover:bg-slate-900 ${isActive ? 'ring-2 ring-brand/40' : ''}`}
      aria-label={`Open lead ${lead.name} from ${lead.location}`}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sm font-bold uppercase text-sky-700 dark:bg-slate-800 dark:text-slate-100"
          aria-label={`Lead initials ${lead.initials}`}
          role="img"
        >
          {lead.initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{lead.name}</p>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{lead.location} · {lead.amount}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${score.color}`}>
          <ScoreIcon size={14} />
          {score.label}
        </span>
      </div>
    </button>
  )
}

LeadItem.propTypes = {
  lead: PropTypes.shape({
    initials: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    amount: PropTypes.string.isRequired,
    score: PropTypes.oneOf(['High', 'Medium', 'Low']).isRequired,
  }).isRequired,
  onSelect: PropTypes.func,
  isActive: PropTypes.bool,
}

LeadItem.defaultProps = {
  onSelect: null,
  isActive: false,
}
