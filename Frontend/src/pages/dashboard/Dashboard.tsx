// src/pages/dashboard/Dashboard.tsx
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, CalendarDays, CheckCircle2, Circle,
  Users, TrendingUp, Sparkles, Info, AlertTriangle,
} from 'lucide-react'
import { useAuth }           from '@/hooks/useAuth'
import { DashboardLayout }   from '@/components/layout/DashboardLayout'
import { StatsCard }         from '@/components/dashboard/StatsCard'
import { LeadItem }          from '@/components/dashboard/LeadItem'

// ─── Data ─────────────────────────────────────────────────────────────────────

const statCards = [
  {
    label: 'Total leads',
    value: 248,
    trend: '+12 this week',
    trendPositive: true,
    accentLabel: 'Growth',
    icon: <Users size={20} className="text-brand" />,
  },
  {
    label: 'Qualified leads',
    value: 34,
    trend: '+5 this week',
    trendPositive: true,
    accentLabel: 'Verified',
    icon: <CheckCircle2 size={20} className="text-emerald-400" />,
  },
  {
    label: 'New today',
    value: 12,
    trend: '+3 vs yesterday',
    trendPositive: true,
    accentLabel: 'Fresh',
    icon: <Sparkles size={20} className="text-brand" />,
  },
  {
    label: 'AI match rate',
    value: '87%',
    trend: '+2% this month',
    trendPositive: true,
    accentLabel: 'Accuracy',
    icon: <TrendingUp size={20} className="text-brand" />,
  },
]

type LeadScore = 'High' | 'Medium' | 'Low'
type Lead = { id: string; initials: string; name: string; location: string; amount: string; score: LeadScore }

const leadSources = [
  { source: 'Facebook',  percentage: 68, amount: 170, color: '#6366f1' },
  { source: 'Instagram', percentage: 32, amount: 80,  color: '#f59e0b' },
]

const scoreLegend = [
  { title: 'High match',   description: 'Strong buyer fit with budget and location.',  icon: CheckCircle2,  tone: 'text-emerald-400' },
  { title: 'Medium match', description: 'Potential fit, needs follow-up details.',     icon: AlertTriangle, tone: 'text-amber-400'   },
  { title: 'Low match',    description: 'Low confidence, may need requalification.',   icon: Circle,        tone: 'text-red-400'     },
]

const initialLeads: Lead[] = [
  { id: '1', initials: 'DK', name: 'Dilanka K.',  location: 'Colombo 7',   amount: '150,000', score: 'High'   },
  { id: '2', initials: 'NP', name: 'Nadia P.',    location: 'Nugegoda',    amount: '120,000', score: 'Medium' },
  { id: '3', initials: 'RS', name: 'Roshan S.',   location: 'Mt. Lavinia', amount: '90,000',  score: 'Low'    },
  { id: '4', initials: 'KM', name: 'Kumari M.',   location: 'Colombo 3',   amount: '180,000', score: 'High'   },
  { id: '5', initials: 'AP', name: 'Ashan P.',    location: 'Battaramulla',amount: '110,000', score: 'Medium' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user }   = useAuth()
  const [query,      setQuery]     = useState('')
  const [isLoading,  setIsLoading] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setIsLoading(false), 700)
    return () => window.clearTimeout(t)
  }, [])

  const today = useMemo(
    () => new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  )

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return initialLeads
    return initialLeads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q) ||
      l.score.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <DashboardLayout activeNav="Dashboard">
      {/*
       * RESPONSIVE WRAPPER
       * - px scales: 4 (mobile) → 6 (sm) → 8 (md) → 10 (lg) → 12 (xl)
       * - py fixed at 6 (mobile) → 10 (lg)
       */}
      <div className="w-full px-4 py-6 text-slate-100 sm:px-6 md:px-8 lg:px-10 lg:py-10 xl:px-12">
        <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">

          {/* ── Greeting banner ─────────────────────────────────────────── */}
          <section className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-5 shadow-panel sm:rounded-[28px] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {/* Friendly greeting — readable size, not all-caps tiny text */}
                <p className="text-sm font-medium text-slate-400">
                  Good morning,  👋
                </p>
                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                  Welcome back to LeadAI.
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Here's what's happening with your lead pipeline today.
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <CalendarDays size={13} />
                  {today}
                </p>
              </div>
              {/* <button className="flex-shrink-0 self-start rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 sm:self-auto">
                Dashboard overview
              </button> */}
            </div>
          </section>

          {/* ── Stat cards ──────────────────────────────────────────────── */}
          {/*
           * FIX: was `lg:grid-cols-[1.5fr,1fr]` with stat cards inside the
           * left half — cards had no height constraint and stretched.
           * Now stat cards live in their own full-width 2→4 col grid so
           * they only grow to fit their content, not the row around them.
           */}
          <section
            className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-4"
            aria-label="Pipeline statistics"
          >
            {statCards.map(card => (
              <StatsCard key={card.label} card={card} isLoading={isLoading} />
            ))}
          </section>

          {/* ── Mid section: source bars + score legend ──────────────────── */}
          {/*
           * FIX: was nested inside the stat-card grid causing alignment issues.
           * Now a clean 1-col (mobile) → 2-col (lg) grid at the same level.
           */}
          <section className="grid gap-5 lg:grid-cols-2">

            {/* Leads by source */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-5 shadow-panel sm:rounded-[28px] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white sm:text-lg">Leads by source</h2>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Lead count and conversion share per channel.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  <CalendarDays size={13} /> Updated today
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {leadSources.map(src => (
                  <div key={src.source}>
                    <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-200">
                      <span>{src.source}</span>
                      <span className="text-xs text-slate-400">
                        {src.percentage}% · <span className="font-semibold text-slate-200">{src.amount} leads</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${src.percentage}%`, background: src.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Match score legend */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-5 shadow-panel sm:rounded-[28px] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white sm:text-lg">Match score legend</h2>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    What match quality means for each lead.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
                  <Info size={13} /> High = top priority
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {scoreLegend.map(item => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/80 p-3 sm:gap-4 sm:p-4"
                    >
                      <div className={`mt-0.5 flex-shrink-0 rounded-xl bg-slate-800 p-2 ${item.tone}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── Recent leads ─────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-5 shadow-panel sm:rounded-[28px] sm:p-6">
            {/* Header + search */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Recent leads</h2>
                <p className="mt-0.5 text-sm text-slate-500">Search and review your latest leads.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Search */}
                <label className="relative block w-full sm:w-64 md:w-72">
                  <span className="sr-only">Search leads</span>
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Name, location or score…"
                    aria-label="Search leads"
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 py-2.5 pl-4 pr-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </span>
                </label>
                <button className="flex-shrink-0 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-slate-800 transition hover:bg-slate-800">
                  Filter
                </button>
              </div>
            </div>

            {/* Lead rows */}
            <div className="mt-5 grid gap-2.5">
              {filteredLeads.map(lead => (
                <LeadItem key={lead.id} lead={lead} onSelect={() => {}} />
              ))}
              {filteredLeads.length === 0 && (
                <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-8 text-center text-sm text-slate-500">
                  No matching leads found. Try a different name, location, or score.
                </div>
              )}
            </div>

            {/* CTA */}
            {/* <div className="mt-5 flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
                View all leads <ArrowRight size={16} />
              </button>
            </div> */}
          </section>

        </div>
      </div>
    </DashboardLayout>
  )
}
