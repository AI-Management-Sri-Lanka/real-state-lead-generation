// src/pages/admin/AdminSessionsPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { Search, Loader2, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react'
import { adminSessionsApi, AdminSession } from '@/api/adminApi'

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return sessions
    return sessions.filter(s =>
      s.title?.toLowerCase().includes(q) ||
      String(s.user_id).includes(q)
    )
  }, [sessions, search])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Chat Sessions</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor all AI conversations across the platform</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="rounded-2xl border border-white/5 bg-[#13152a] px-5 py-4 flex items-center gap-4 w-fit">
        <MessageSquare size={20} className="text-cyan-400" />
        <div>
          <p className="text-xs text-slate-500">Total Sessions</p>
          <p className="text-2xl font-extrabold text-white">{sessions.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by session title or user ID..."
          className="w-full rounded-xl border border-white/10 bg-[#13152a] py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-colors"
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
        <div className="py-20 text-center text-slate-600">
          {search ? 'No sessions match your search.' : 'No chat sessions found.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#13152a] text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Session</th>
                <th className="px-5 py-3">User ID</th>
                <th className="px-5 py-3">Messages</th>
                <th className="px-5 py-3 hidden md:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-cyan-600/20 flex items-center justify-center">
                        <MessageSquare size={16} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white truncate max-w-xs">{s.title || 'Untitled Session'}</p>
                        <p className="text-xs text-slate-600 font-mono">{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400">#{s.user_id}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-400">
                      {s.message_count ?? 0} msgs
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-xs text-slate-600">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-white/5 bg-[#13152a] px-5 py-3 text-xs text-slate-600 text-right">
            Showing {filtered.length} of {sessions.length} sessions
          </div>
        </div>
      )}
    </div>
  )
}
