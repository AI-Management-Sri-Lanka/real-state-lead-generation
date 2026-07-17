// src/pages/admin/AdminInquiriesPage.tsx
import { useState, useEffect, useMemo } from 'react'
import { Search, Loader2, AlertCircle, RefreshCw, Star, Mail, Phone, Calendar } from 'lucide-react'
import { adminInquiriesApi, AdminInquiry } from '@/api/adminApi'

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      setLoading(true); setError(null)
      const { inquiries: data } = await adminInquiriesApi.listAll({ limit: 500 })
      setInquiries(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inquiries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return inquiries
    return inquiries.filter(i =>
      i.name?.toLowerCase().includes(q) ||
      i.email?.toLowerCase().includes(q) ||
      i.property_title?.toLowerCase().includes(q) ||
      i.source?.toLowerCase().includes(q)
    )
  }, [inquiries, search])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Global Inquiries</h1>
          <p className="mt-1 text-sm text-slate-500">Monitor all leads and contact requests across the platform</p>
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

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, property, or source..."
          className="w-full rounded-xl border border-white/10 bg-[#13152a] py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-900/50 bg-red-950/20 p-5 text-sm text-red-400">
          <AlertCircle size={20} className="shrink-0" /> {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-slate-600">
          {search ? 'No inquiries match your search.' : 'No inquiries found.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(inq => (
            <div key={inq.id} className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#13152a] p-5 group hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                    <Star size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">{inq.name}</h3>
                    <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
                      {inq.source}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">#{inq.id}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Mail size={14} className="text-slate-500" />
                  <a href={`mailto:${inq.email}`} className="hover:text-indigo-400 transition-colors">{inq.email}</a>
                </div>
                {inq.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Phone size={14} className="text-slate-500" />
                    <a href={`tel:${inq.phone}`} className="hover:text-indigo-400 transition-colors">{inq.phone}</a>
                  </div>
                )}
                {inq.property_title && (
                  <div className="flex items-center gap-2 text-sm text-emerald-300">
                    <Star size={14} className="text-emerald-500" />
                    <span className="truncate" title={inq.property_title}>{inq.property_title}</span>
                  </div>
                )}
              </div>

              {inq.message && (
                <div className="mt-4 rounded-xl bg-white/5 p-4 text-sm text-slate-300 border border-white/10">
                  <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    <p className="whitespace-pre-wrap">{inq.message}</p>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500">
                <Calendar size={12} />
                {new Date(inq.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
