import { useEffect, useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { fetchWithAuth } from '@/api/authApi'
import { BASE_URL } from '@/api/config'
import {
  Loader2, Zap, Search, ExternalLink, MapPin, Calendar,
  Tag, User, ArrowRight, Filter, X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type Lead = {
  userId?: string
  username?: string
  name?: string
  platform: string
  property_type?: string
  location?: string
  date?: string
  description?: string
  post_link?: string
}

type EnrichedLead = Lead & {
  sessionTitle: string
  sessionId: string
  foundAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  instagram: { bg: 'bg-pink-50',    text: 'text-pink-700',   border: 'border-pink-200',   dot: 'bg-pink-500'   },
  tiktok:    { bg: 'bg-cyan-50',    text: 'text-cyan-700',   border: 'border-cyan-200',   dot: 'bg-cyan-500'   },
  facebook:  { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500'   },
  twitter:   { bg: 'bg-sky-50',     text: 'text-sky-700',    border: 'border-sky-200',    dot: 'bg-sky-500'    },
  linkedin:  { bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  reddit:    { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
}

function getPlatformStyle(platform: string) {
  return PLATFORM_STYLES[platform?.toLowerCase()] ?? {
    bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400'
  }
}

function parseLeadsFromContent(content: string): Lead[] {
  if (!content) return []

  const leads: Lead[] = []

  // ── Format 1: "### N. @handle &middot; Platform"  (actual orchestrator format)
  // Fields: - **Name:**, - **Property type:**, - **Location:**, - **Posted:**
  // Description: blockquote "> text"
  // Link: [View post](url)
  const middotBlocks = content.split(/(?=###\s+\d+\.\s+@)/).slice(1)
  if (middotBlocks.length > 0) {
    middotBlocks.forEach((block) => {
      // Match "### N. @handle &middot; Platform" or "### N. @handle · Platform"
      const headMatch = block.match(/###\s+\d+\.\s+(@[\w.]+)\s*(?:&middot;|·|-|–)\s*(\w+)/)
      if (!headMatch) return

      // Fields use bold labels: "- **Name:** value" or "- **Property type:** value"
      const nameMatch   = block.match(/\*\*Name:\*\*\s*(.+)/i)
      const propMatch   = block.match(/\*\*Property\s+type:\*\*\s*(.+)/i)
      const locMatch    = block.match(/\*\*Location:\*\*\s*(.+)/i)
      const dateMatch   = block.match(/\*\*Posted:\*\*\s*(.+)/i) || block.match(/\*\*Date:\*\*\s*(.+)/i)
      // Description is a blockquote line starting with "> "
      const descMatch   = block.match(/^>\s*(.+)/m)
      // Link: [View post](url)
      const linkMatch   = block.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/)

      leads.push({
        userId:        headMatch[1].replace('@', ''),
        platform:      headMatch[2].toLowerCase(),
        name:          nameMatch?.[1]?.trim(),
        property_type: propMatch?.[1]?.trim(),
        location:      locMatch?.[1]?.trim(),
        date:          dateMatch?.[1]?.trim(),
        description:   descMatch?.[1]?.trim(),
        post_link:     linkMatch?.[1]?.trim(),
      })
    })
    if (leads.length > 0) return leads
  }

  // ── Format 2: "### N. @handle - Platform" (dash separator, plain labels)
  const headingBlocks = content.split(/(?=###\s+\d+\.\s+@)/).slice(1)
  if (headingBlocks.length > 0) {
    headingBlocks.forEach((block) => {
      const headMatch = block.match(/###\s+\d+\.\s+(@[\w.]+)\s*[-–(]\s*(\w+)/)
      if (!headMatch) return

      const nameMatch  = block.match(/[-*]\s*(?:\*\*)?Name:(?:\*\*)?\s*(.+)/i)
      const propMatch  = block.match(/[-*]\s*(?:\*\*)?Property\s+[Tt]ype:(?:\*\*)?\s*(.+)/i)
      const locMatch   = block.match(/[-*]\s*(?:\*\*)?Location:(?:\*\*)?\s*(.+)/i)
      const dateMatch  = block.match(/[-*]\s*(?:\*\*)?(?:Date|Posted):(?:\*\*)?\s*(.+)/i)
      const descMatch  = block.match(/^>\s*(.+)/m)
      const linkMatch  = block.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/)

      leads.push({
        userId:        headMatch[1].replace('@', ''),
        platform:      headMatch[2].toLowerCase(),
        name:          nameMatch?.[1]?.trim(),
        property_type: propMatch?.[1]?.trim(),
        location:      locMatch?.[1]?.trim(),
        date:          dateMatch?.[1]?.trim(),
        description:   descMatch?.[1]?.trim(),
        post_link:     linkMatch?.[1]?.trim(),
      })
    })
    if (leads.length > 0) return leads
  }

  // ── Format 3: "**N. @handle** (platform)" — older bold format
  const boldBlocks = content.split(/(?=\*\*\d+\.\s+@)/).slice(1)
  boldBlocks.forEach((block) => {
    const handleMatch = block.match(/\*\*\d+\.\s+(@[\w.]+)\*\*\s*\((\w+)\)/)
    if (!handleMatch) return

    const nameMatch  = block.match(/Name:\s*(.+)/i)
    const propMatch  = block.match(/Property\s+[Tt]ype:\s*(.+)/i)
    const locMatch   = block.match(/Location:\s*(.+)/i)
    const dateMatch  = block.match(/(?:Date|Posted):\s*(.+)/i)
    const descMatch  = block.match(/^>\s*(.+)/m) || block.match(/Post:\s*"?([\s\S]+?)(?="?\s*\n\s*(?:Link:|$))/i)
    const linkMatch  = block.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/) || block.match(/Link:\s*(https?:\/\/\S+)/i)

    leads.push({
      userId:        handleMatch[1].replace('@', ''),
      platform:      handleMatch[2].toLowerCase(),
      name:          nameMatch?.[1]?.trim(),
      property_type: propMatch?.[1]?.trim(),
      location:      locMatch?.[1]?.trim(),
      date:          dateMatch?.[1]?.trim(),
      description:   descMatch?.[1]?.trim(),
      post_link:     Array.isArray(linkMatch) ? linkMatch[1]?.trim() : undefined,
    })
  })

  return leads.filter((l) => l.userId && l.userId !== 'unknown')
}



function dedupe(leads: EnrichedLead[]): EnrichedLead[] {
  const seen = new Set<string>()
  return leads.filter((l) => {
    const key = l.post_link || `${l.userId}::${l.platform}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead, index }: { lead: EnrichedLead; index: number }) {
  const style      = getPlatformStyle(lead.platform)
  const handle     = lead.userId || lead.username || 'unknown'
  const displayName = lead.name && lead.name !== handle ? lead.name : null
  const formattedDate = lead.date
    ? new Date(lead.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  const shortDesc = lead.description
    ? lead.description.length > 200
      ? lead.description.substring(0, 200) + '…'
      : lead.description
    : null

  return (
    <div className="group flex flex-col gap-4 rounded-[24px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.96))] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:border-sky-300 hover:shadow-[0_16px_40px_rgba(14,116,144,0.12)] hover:-translate-y-0.5 dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#0f172a,#111827)] dark:hover:border-sky-700/60">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Number badge */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white shadow-[0_4px_12px_rgba(14,116,144,0.3)]">
            {index}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">@{handle}</p>
            {displayName && (
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{displayName}</p>
            )}
          </div>
        </div>
        {/* Platform badge */}
        <span className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${style.bg} ${style.text} ${style.border} dark:bg-opacity-20`}>
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {lead.platform}
        </span>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2">
        {lead.property_type && lead.property_type !== 'unknown' && (
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
            <Tag size={11} /> {lead.property_type}
          </div>
        )}
        {lead.location && lead.location !== 'null' && lead.location !== 'unknown' && (
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
            <MapPin size={11} /> {lead.location}
          </div>
        )}
        {formattedDate && (
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
            <Calendar size={11} /> {formattedDate}
          </div>
        )}
      </div>

      {/* Post excerpt */}
      {shortDesc && (
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 border-t border-slate-100/80 dark:border-slate-800/60 pt-3 line-clamp-3 italic">
          "{shortDesc}"
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100/80 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <User size={11} />
          <span className="truncate max-w-[130px]" title={lead.sessionTitle}>{lead.sessionTitle}</span>
        </div>
        {lead.post_link ? (
          <a
            href={lead.post_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(14,116,144,0.3)] transition hover:bg-sky-600"
          >
            <ExternalLink size={11} /> View post
          </a>
        ) : (
          <span className="text-[11px] text-slate-300 dark:text-slate-600">No link</span>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PLATFORMS = ['All', 'Instagram', 'TikTok', 'Facebook', 'Twitter', 'LinkedIn', 'Reddit']

export default function FoundLeadsPage() {
  const navigate = useNavigate()
  const [leads,         setLeads]         = useState<EnrichedLead[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [query,         setQuery]         = useState('')
  const [platform,      setPlatform]      = useState('All')
  const [showFilters,   setShowFilters]   = useState(false)

  useEffect(() => {
    async function loadLeads() {
      try {
        setLoading(true)
        const sessRes = await fetchWithAuth(`${BASE_URL}/sessions`)
        if (!sessRes.ok) throw new Error('Could not load sessions')
        const sessions: { session_id: string; title: string; updated_at: string }[] = await sessRes.json()

        const allLeads: EnrichedLead[] = []

        await Promise.all(
          sessions.map(async (sess) => {
            try {
              const msgRes = await fetchWithAuth(`${BASE_URL}/sessions/${sess.session_id}`)
              if (!msgRes.ok) return
              const data = await msgRes.json()
              const messages: { role: string; content: string; leads?: Lead[] }[] = data.messages ?? []

              messages.forEach((msg) => {
                if (msg.role !== 'assistant') return

                // Prefer structured leads attached to the message
                const structuredLeads: Lead[] = msg.leads ?? []
                const parsedLeads: Lead[] = structuredLeads.length > 0
                  ? structuredLeads
                  : parseLeadsFromContent(msg.content ?? '')

                parsedLeads.forEach((lead) => {
                  allLeads.push({
                    ...lead,
                    sessionTitle: sess.title || 'Untitled chat',
                    sessionId:    sess.session_id,
                    foundAt:      sess.updated_at,
                  })
                })
              })
            } catch { /* skip bad session */ }
          })
        )

        setLeads(dedupe(allLeads))
      } catch (err: any) {
        setError(err.message || 'Failed to load leads')
      } finally {
        setLoading(false)
      }
    }
    loadLeads()
  }, [])

  const filtered = useMemo(() => {
    let result = leads
    if (platform !== 'All') {
      result = result.filter((l) => l.platform?.toLowerCase() === platform.toLowerCase())
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter((l) =>
        l.userId?.toLowerCase().includes(q) ||
        l.name?.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q) ||
        l.property_type?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      )
    }
    return result
  }, [leads, query, platform])

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    leads.forEach((l) => {
      const p = l.platform ? l.platform.charAt(0).toUpperCase() + l.platform.slice(1).toLowerCase() : 'Unknown'
      counts[p] = (counts[p] || 0) + 1
    })
    return counts
  }, [leads])

  return (
    <DashboardLayout activeNav="Found Leads">
      <div className="w-full px-4 py-6 sm:px-6 md:px-8 lg:px-10 lg:py-10 xl:px-12">
        <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">

          {/* ── Header ── */}
          <section className="rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.96),rgba(238,242,255,0.96))] p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#020617,#0f172a,#111827)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/60 mb-3">
                  <Zap size={12} className="text-sky-500" /> AI Scraped Buyers
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Found Leads
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  All buyers discovered by your AI assistant across every chat session — deduplicated and ready to action.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 px-5 py-3 text-center shadow-[0_10px_25px_rgba(14,116,144,0.3)]">
                  <p className="text-3xl font-bold text-white">{leads.length}</p>
                  <p className="text-xs font-medium text-sky-100">Total found</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Filters & Search ── */}
          <section className="rounded-[28px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.95))] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-sky-800/40 dark:bg-[linear-gradient(135deg,#0f172a,#111827)] sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <label className="relative block w-full md:max-w-sm">
                <span className="sr-only">Search leads</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, location, platform…"
                  className="w-full rounded-2xl border border-sky-200 bg-white/90 py-2.5 pl-4 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <Search size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </label>

              {/* Platform pills */}
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.filter((p) => p === 'All' || (platformCounts[p] ?? 0) > 0).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition border ${
                      platform === p
                        ? 'bg-sky-500 text-white border-sky-500 shadow-[0_4px_12px_rgba(14,116,144,0.3)]'
                        : 'border-sky-200/80 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-sky-600'
                    }`}
                  >
                    {p} {p !== 'All' && platformCounts[p] ? `(${platformCounts[p]})` : p === 'All' ? `(${leads.length})` : ''}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Content ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 dark:bg-slate-800">
                <Loader2 size={28} className="animate-spin text-sky-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Scanning your chat sessions for found leads…</p>
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/20">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-6 rounded-[28px] border border-dashed border-sky-200/80 bg-white/60 py-24 text-center dark:border-slate-800/60 dark:bg-slate-900/40">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50 text-sky-500 dark:bg-slate-800 dark:text-sky-400">
                <Zap size={36} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No leads found yet</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Ask the AI assistant to find buyers from social media. Your found leads will automatically appear here.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard/ai-assistant')}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(14,116,144,0.3)] transition hover:from-sky-400 hover:to-indigo-500"
              >
                Open AI Chat <ArrowRight size={16} />
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-sky-200/80 bg-white/60 py-20 text-center dark:border-slate-800/60 dark:bg-slate-900/40">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No leads match your search. Try a different filter.
              </p>
              <button
                onClick={() => { setQuery(''); setPlatform('All') }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-400 hover:text-sky-700 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              >
                <X size={14} /> Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((lead, i) => (
                <LeadCard key={`${lead.userId}-${lead.platform}-${i}`} lead={lead} index={i + 1} />
              ))}
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  )
}
