// src/pages/admin/AdminSessionsPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { Search, Loader2, MessageSquare, AlertCircle, RefreshCw, Eye, X, Bot, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminSessionsApi, adminChatApi, AdminSession, AdminMessage } from '@/api/adminApi'

const PAGE_SIZE = 10

function getPageNumbers(current: number, total: number): (number | '…')[] {
  const delta = 1
  const range: (number | '…')[] = []
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  range.push(1)
  if (left > 2) range.push('…')
  for (let i = left; i <= right; i++) range.push(i)
  if (right < total - 1) range.push('…')
  if (total > 1) range.push(total)

  return range
}

function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Sessions pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-300 transition hover:border-indigo-500 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:text-slate-300"
      >
        <ChevronLeft size={14} /> Previous
      </button>

      {getPageNumbers(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-xs text-slate-500 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition ${
              p === page
                ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.4)]'
                : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500 hover:text-indigo-300'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-300 transition hover:border-indigo-500 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:text-slate-300"
      >
        Next <ChevronRight size={14} />
      </button>
    </nav>
  )
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true); setError(null)
      const { sessions: data } = await adminSessionsApi.getSessions({ limit: 200 })
      setSessions(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([])
      return
    }
    const fetchMessages = async () => {
      setMessagesLoading(true)
      setMessagesError(null)
      try {
        const data = await adminChatApi.getSessionMessages(selectedSessionId)
        setMessages(data)
      } catch (err: unknown) {
        setMessagesError(err instanceof Error ? err.message : 'Failed to load messages')
      } finally {
        setMessagesLoading(false)
      }
    }
    fetchMessages()
  }, [selectedSessionId])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return sessions
    return sessions.filter(s =>
      s.title?.toLowerCase().includes(q) ||
      String(s.user_id).includes(q)
    )
  }, [sessions, search])

  useEffect(() => {
    setPage(1)
  }, [search, sessions])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  return (
    <div className="flex flex-1 flex-col max-w-7xl mx-auto w-full relative">

      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Chat Sessions</h1>
            <p className="mt-1 text-sm text-slate-500">Monitor all AI conversations across the platform</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 flex items-center gap-4 w-full sm:w-fit shadow-sm">
          <MessageSquare size={20} className="text-cyan-400" />
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Sessions</p>
            <p className="text-2xl font-extrabold text-white">{sessions.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by session title or user ID..."
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-900/50 bg-red-950/20 p-5 text-sm text-red-400">
            <AlertCircle size={20} className="shrink-0" /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-medium">
            {search ? 'No sessions match your search.' : 'No chat sessions found.'}
          </div>
        ) : (
          <>
          {/* Mobile card list (no horizontal scrolling) */}
          <div className="space-y-3 md:hidden">
            {paginated.map((s, i) => (
              <div key={s.session_id || i} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                    <MessageSquare size={16} className="text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{s.title || 'Untitled Session'}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{s.session_id}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>#{s.user_id || 'Guest'}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 font-semibold text-indigo-400">
                      {s.message_count ?? 0} msgs
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setTranscriptOpen(true)
                      if (!s.session_id) {
                        setSelectedSessionId(null)
                        setMessages([])
                        setMessagesLoading(false)
                        setMessagesError('This session is missing an id, so its transcript cannot be loaded.')
                        return
                      }
                      setSelectedSessionId(s.session_id)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    <Eye size={13} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-md md:block">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                  <th className="px-5 py-3.5">Session</th>
                  <th className="px-5 py-3.5">User ID</th>
                  <th className="px-5 py-3.5">Messages</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginated.map((s, i) => (
                  <tr key={s.session_id || i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                          <MessageSquare size={16} className="text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white truncate max-w-xs">{s.title || 'Untitled Session'}</p>
                          <p className="text-xs text-slate-400 font-mono truncate w-24">{s.session_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-medium">#{s.user_id || 'Guest'}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 text-xs font-semibold text-indigo-400">
                        {s.message_count ?? 0} msgs
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-xs text-slate-300 font-medium">
                      {s.updated_at ? new Date(s.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setTranscriptOpen(true)
                          if (!s.session_id) {
                            console.error('Session is missing an id — cannot open transcript', s)
                            setSelectedSessionId(null)
                            setMessages([])
                            setMessagesLoading(false)
                            setMessagesError('This session is missing an id, so its transcript cannot be loaded.')
                            return
                          }
                          setSelectedSessionId(s.session_id)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <Eye size={14} /> Transcript
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          </>
        )}
      </div>

      {/* ── Footer / pagination — pinned to the bottom of the viewport ──────── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-auto pt-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-400 font-semibold">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} sessions
            </p>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      {transcriptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/60 p-4">
              <div>
                <h2 className="text-base font-bold text-white">Session Transcript</h2>
                {selectedSessionId && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedSessionId}</p>
                )}
              </div>
              <button
                onClick={() => { setTranscriptOpen(false); setSelectedSessionId(null) }}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                  <Loader2 size={24} className="animate-spin text-cyan-500" />
                  <p className="text-sm">Loading transcript...</p>
                </div>
              ) : messagesError ? (
                <div className="flex items-center gap-3 rounded-2xl border border-red-900/50 bg-red-950/20 p-5 text-sm text-red-400">
                  <AlertCircle size={20} className="shrink-0" /> {messagesError}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <p>No messages in this session.</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role !== 'user' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cyan-600/20 flex items-center justify-center mt-1">
                        <Bot size={16} className="text-cyan-400" />
                      </div>
                    )}
                    
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-[#1a1c30] text-slate-300 rounded-bl-sm border border-white/5'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-2 font-medium ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-600/20 flex items-center justify-center mt-1">
                        <User size={16} className="text-indigo-400" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}