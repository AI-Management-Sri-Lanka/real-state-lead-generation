// src/pages/dashboard/Dashboard.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays, CheckCircle2, Circle, ChevronDown, Check,
  Users, Sparkles, Info, AlertTriangle, MessageSquare,
} from 'lucide-react'
import { useAuth }           from '@/hooks/useAuth'
import { DashboardLayout }   from '@/components/layout/DashboardLayout'
import { StatsCard }         from '@/components/dashboard/StatsCard'
import { LeadItem }          from '@/components/dashboard/LeadItem'
import { fetchOwnerDashboardStats, type OwnerDashboardStats } from '@/api/dashboardApi'
import { useNavigate }       from 'react-router-dom'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function buildStatCards(stats: OwnerDashboardStats | null, navigate: ReturnType<typeof useNavigate>) {
  return [
    {
      label: 'Total Inquiries',
      value: stats?.total_inquiries ?? 0,
      trend: 'All property requests',
      trendPositive: true,
      accentLabel: 'Requests',
      icon: <Users size={20} className="text-brand" />,
      onClick: () => navigate('/dashboard/requests'),
    },
    {
      label: 'AI Chats',
      value: stats?.totalChats ?? 0,
      trend: 'Your assistant chats',
      trendPositive: true,
      accentLabel: 'Chats',
      icon: <MessageSquare size={20} className="text-emerald-400" />,
      onClick: () => navigate('/dashboard/ai-assistant'),
    },
    {
      label: 'Scraped Leads',
      value: stats?.scrapedLeads ?? 0,
      trend: 'Tap to view AI found buyers',
      trendPositive: (stats?.scrapedLeads ?? 0) > 0,
      accentLabel: 'Scraped',
      icon: <Sparkles size={20} className="text-brand" />,
      onClick: () => navigate('/dashboard/found-leads'),
    },
    {
      label: 'Total Properties',
      value: stats?.totalProperties ?? 0,
      trend: 'Listed properties',
      trendPositive: true,
      accentLabel: 'Properties',
      icon: <Users size={20} className="text-brand" />,
      onClick: () => navigate('/dashboard/properties'),
    },
  ]
}

type LeadScore = 'High' | 'Medium' | 'Low'
type Lead = { id: string; initials: string; name: string; location: string; amount: string; score: LeadScore }

// Backend values aren't guaranteed to match the exact 'High' | 'Medium' | 'Low' casing
// (or may be missing entirely), so normalize before comparing/displaying.
function normalizeScore(raw: unknown): LeadScore {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'high') return 'High'
  if (s === 'medium') return 'Medium'
  return 'Low'
}



const scoreLegend = [
  { title: 'High match',   description: 'Strong buyer fit with budget and location.',  icon: CheckCircle2,  tone: 'text-emerald-400' },
  { title: 'Medium match', description: 'Potential fit, needs follow-up details.',     icon: AlertTriangle, tone: 'text-amber-400'   },
  { title: 'Low match',    description: 'Low confidence, may need requalification.',   icon: Circle,        tone: 'text-red-400'     },
]

const initialLeads: Lead[] = []

const priorityFilterOptions: Array<{ label: string; value: LeadScore | 'All' }> = [
  { label: 'All priorities', value: 'All' },
  { label: 'High',           value: 'High' },
  { label: 'Medium',         value: 'Medium' },
  { label: 'Low',            value: 'Low' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user }   = useAuth()
  const navigate = useNavigate()
  const [query,          setQuery]         = useState('')
  const [isLoading,      setIsLoading]     = useState(true)
  const [stats,          setStats]         = useState<OwnerDashboardStats | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<LeadScore | 'All'>('All')
  const [isFilterOpen,   setIsFilterOpen]   = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchOwnerDashboardStats()
      .then(setStats)
      .catch(() => { /* keep null stats; cards show 0 */ })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const today = useMemo(
    () => new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' }),
    [],
  )

  const filteredLeads = useMemo(() => {
    const leadsToFilter = stats?.recentLeads ?? initialLeads
    const q = query.trim().toLowerCase()
    return leadsToFilter.filter(l => {
      const score = normalizeScore(l.score)
      if (priorityFilter !== 'All' && score !== priorityFilter) return false
      if (!q) return true
      return (
        l.name.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        score.toLowerCase().includes(q)
      )
    })
  }, [query, stats, priorityFilter])

  const currentLeadSources = stats?.leadsBySource || []

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
          <section className="rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.96),rgba(238,242,255,0.96))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.45)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {/* Friendly greeting — readable size, not all-caps tiny text */}
                <p className="text-sm font-medium text-slate-400">
                  {getGreeting()}, {user?.full_name ?? ''} 👋
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
            {buildStatCards(stats, navigate).map(card => (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                className="text-left transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-300 rounded-[28px]"
                aria-label={`Go to ${card.label}`}
              >
                <StatsCard card={card} isLoading={isLoading} />
              </button>
            ))}
          </section>

          {/* ── Mid section: source bars + score legend ──────────────────── */}
          {/*
           * FIX: was nested inside the stat-card grid causing alignment issues.
           * Now a clean 1-col (mobile) → 2-col (lg) grid at the same level.
           */}
          <section className="grid gap-5 lg:grid-cols-2">

            {/* Leads by source */}
            <div className="rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] p-5 shadow-[0_16px_35px_rgba(15,23,42,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_16px_35px_rgba(2,6,23,0.35)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">Leads by source</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                    Lead count and conversion share per channel.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                  <CalendarDays size={13} /> Updated today
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {currentLeadSources.length > 0 ? (
                  currentLeadSources.map(src => (
                    <div key={src.source}>
                      <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
                        <span>{src.source}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {src.percentage}% · <span className="font-semibold text-slate-700 dark:text-slate-200">{src.amount} leads</span>
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-900">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${src.percentage}%`, background: src.color }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-sky-200/50 bg-white/50 p-6 text-center text-sm text-slate-500 dark:border-slate-800/50 dark:bg-slate-900/50 dark:text-slate-400">
                    No lead sources available yet. Share your properties to start generating leads!
                  </div>
                )}
              </div>
            </div>

            {/* Match score legend */}
            <div className="rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] p-5 shadow-[0_16px_35px_rgba(15,23,42,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_16px_35px_rgba(2,6,23,0.35)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">Match score legend</h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                    What match quality means for each lead.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                  <Info size={13} /> High = top priority
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {scoreLegend.map(item => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-3 rounded-2xl border border-sky-200/70 bg-white/70 p-3 shadow-sm sm:gap-4 sm:p-4 dark:border-sky-800/40 dark:bg-slate-900/70"
                    >
                      <div className={`mt-0.5 flex-shrink-0 rounded-xl bg-sky-50 p-2 dark:bg-slate-800 ${item.tone}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* ── Lead Quality Insights ────────────────────────────────────── */}
          <section className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5 md:grid-cols-3">
            <div className="rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] p-5 shadow-[0_16px_35px_rgba(15,23,42,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_16px_35px_rgba(2,6,23,0.35)] sm:p-6 flex items-center justify-between transition hover:-translate-y-1 hover:shadow-lg">
               <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest dark:text-slate-400">Qualified Leads</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">High & medium intent buyers</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats?.qualified_leads ?? 0}</p>
               </div>
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 ring-1 ring-emerald-200/50">
                  <CheckCircle2 size={26} />
               </div>
            </div>

            <div className="rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] p-5 shadow-[0_16px_35px_rgba(15,23,42,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_16px_35px_rgba(2,6,23,0.35)] sm:p-6 flex items-center justify-between transition hover:-translate-y-1 hover:shadow-lg">
               <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest dark:text-slate-400">New Today</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Inquiries from last 24 hours</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats?.new_leads_today ?? 0}</p>
               </div>
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 ring-1 ring-sky-200/50">
                  <CalendarDays size={26} />
               </div>
            </div>

            <div className="rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] p-5 shadow-[0_16px_35px_rgba(15,23,42,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_16px_35px_rgba(2,6,23,0.35)] sm:p-6 flex items-center justify-between transition hover:-translate-y-1 hover:shadow-lg">
               <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest dark:text-slate-400">AI Match Rate</p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">% of qualified vs total leads</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stats?.aiMatchRate ?? '0%'}</p>
               </div>
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 ring-1 ring-indigo-200/50">
                  <Sparkles size={26} />
               </div>
            </div>
          </section>

          {/* ── Recent leads ─────────────────────────────────────────────── */}
          <section className="rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95),rgba(238,242,255,0.95))] p-5 shadow-[0_16px_35px_rgba(15,23,42,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] dark:shadow-[0_16px_35px_rgba(2,6,23,0.35)] sm:p-6">
            {/* Header + search */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent leads</h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Search and review your latest leads.</p>
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
                    className="w-full rounded-2xl border border-sky-200 bg-white/90 py-2.5 pl-4 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:ring-sky-400/20"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </span>
                </label>
                <div className="relative flex-shrink-0" ref={filterRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(open => !open)}
                    aria-haspopup="listbox"
                    aria-expanded={isFilterOpen}
                    className={`flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${
                      priorityFilter !== 'All'
                        ? 'bg-sky-600 text-white ring-sky-600 hover:bg-sky-700'
                        : 'bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100 dark:bg-slate-900 dark:text-white dark:ring-slate-800 dark:hover:bg-slate-800'
                    }`}
                  >
                    {priorityFilter === 'All' ? 'Filter' : `Priority: ${priorityFilter}`}
                    <ChevronDown size={16} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isFilterOpen && (
                    <div
                      role="listbox"
                      className="absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-xl border border-sky-200 bg-white py-1.5 shadow-lg shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30"
                    >
                      {priorityFilterOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={priorityFilter === option.value}
                          onClick={() => { setPriorityFilter(option.value); setIsFilterOpen(false) }}
                          className={`flex w-full items-center justify-between px-4 py-2 text-sm transition hover:bg-sky-50 dark:hover:bg-slate-700 ${
                            priorityFilter === option.value
                              ? 'font-semibold text-sky-700 dark:text-sky-300'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {option.label}
                          {priorityFilter === option.value && <Check size={16} className="text-sky-600 dark:text-sky-300" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lead rows */}
            <div className="mt-5 grid gap-2.5">
              {filteredLeads.map(lead => (
                <LeadItem key={lead.id} lead={lead} onSelect={() => navigate('/dashboard/requests')} />
              ))}
              {filteredLeads.length === 0 && (
                <div className="rounded-2xl border border-sky-200/80 bg-white/70 p-8 text-center text-sm text-slate-500 dark:border-slate-800/90 dark:bg-slate-900/90 dark:text-slate-400">
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