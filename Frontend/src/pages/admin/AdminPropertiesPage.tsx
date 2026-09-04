/**
 * AdminPropertiesPage  — Master Admin only
 * Route: /admin/properties
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Building2, Trash2, ShieldCheck, ShieldOff, Plus, Search,
  Loader2, ExternalLink, MapPin, BedDouble, Bath, AlertCircle,
  RefreshCw, Pencil, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { adminPropertiesApi } from '@/api/adminApi'
import { Property, getCoverImageUrl } from '@/types/property'
import { AddPropertyModal } from '@/components/properties/AddPropertyModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

function StatusBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">
      <ShieldCheck size={11} /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-2 py-0.5 text-xs font-medium text-slate-400">
      Unverified
    </span>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

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
    <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Properties pagination">
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

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [filtered, setFiltered] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminPropertiesApi.listAll({ limit: 500 })
      setProperties(data)
      setFiltered(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const q = search.toLowerCase()
    if (!q) { setFiltered(properties); return }
    setFiltered(properties.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.owner?.full_name?.toLowerCase().includes(q) ||
      p.owner?.email?.toLowerCase().includes(q)
    ))
  }, [search, properties])

  useEffect(() => {
    setPage(1)
  }, [search, properties])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  const handleVerify = async (p: Property) => {
    const next = !p.verified
    setActionLoading(p.id)
    try {
      const updated = await adminPropertiesApi.verify(p.id, next)
      setProperties(prev => prev.map(x => x.id === p.id ? { ...x, verified: updated.verified } : x))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Verify failed')
    } finally {
      setActionLoading(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const p = deleteTarget
    setActionLoading(p.id)
    setDeleting(true)
    try {
      await adminPropertiesApi.delete(p.id)
      setProperties(prev => prev.filter(x => x.id !== p.id))
      setDeleteTarget(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionLoading(null)
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col max-w-7xl mx-auto w-full">

      <div className="space-y-6">

        {/* ── Page Header ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Properties</h1>
            <p className="mt-1 text-sm text-slate-500">Moderate and manage all property listings</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:border-white/20 hover:text-white sm:flex-none"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 sm:flex-none"
            >
              <Plus size={15} /> Add Property
            </button>
          </div>
        </div>

        {/* ── Stats strip ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Properties', value: properties.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
            { label: 'Verified', value: properties.filter(p => p.verified).length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Unverified', value: properties.filter(p => !p.verified).length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{s.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-white">{s.value}</p>
              </div>
              <div className={`p-3 rounded-xl border ${s.bg}`}>
                <Building2 size={20} className={s.color} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Search ────────────────────────────────────────────────── */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, location, or owner name / email…"
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm"
          />
        </div>

        {/* ── Content ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-32 text-slate-500">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-xl border border-red-900/60 bg-red-950/20 p-5 text-red-400">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center text-slate-500">
            {search ? 'No properties match your search.' : 'No properties in the system yet.'}
          </div>
        ) : (
          <>
          {/* Mobile card list (no horizontal scrolling) */}
          <div className="space-y-3 md:hidden">
            {paginated.map(p => (
              <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  {getCoverImageUrl(p.images) ? (
                    <img src={getCoverImageUrl(p.images)!} alt={p.title} className="h-14 w-20 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                      <Building2 size={22} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{p.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
                      <MapPin size={10} />{p.location}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {p.type} · For {p.listingType}
                      {p.bedrooms != null && <> · <BedDouble size={10} className="inline" /> {p.bedrooms}</>}
                      {p.bathrooms != null && <> · <Bath size={10} className="inline" /> {p.bathrooms}</>}
                    </p>
                  </div>
                  <StatusBadge verified={p.verified} />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
                  <div>
                    <p className="text-xs font-medium text-white">
                      {p.price.toLocaleString()} {p.currency}
                      <span className="ml-1 text-slate-500">{p.listingType === 'Rent' ? '/month' : ''}</span>
                    </p>
                    {p.owner ? (
                      <p className="mt-0.5 text-[11px] text-slate-500 truncate max-w-[180px]">{p.owner.full_name}</p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-slate-600">— admin</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/properties/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition hover:border-slate-500 hover:text-white"
                      title="View public page"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <button
                      onClick={() => handleVerify(p)}
                      disabled={actionLoading === p.id}
                      title={p.verified ? 'Un-verify' : 'Verify listing'}
                      className={`rounded-lg border p-1.5 transition ${
                        p.verified
                          ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-950/30'
                          : 'border-slate-700 text-slate-400 hover:border-indigo-600 hover:text-indigo-400'
                      } disabled:opacity-40`}
                    >
                      {actionLoading === p.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : p.verified ? (
                        <ShieldOff size={13} />
                      ) : (
                        <ShieldCheck size={13} />
                      )}
                    </button>
                    <button
                      onClick={() => setEditId(p.id)}
                      className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition hover:border-slate-500 hover:text-white"
                      title="Edit property"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      disabled={actionLoading === p.id}
                      title="Delete property"
                      className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition hover:border-red-700 hover:text-red-400 disabled:opacity-40"
                    >
                      {actionLoading === p.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
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
                  <th className="px-4 py-3.5">Property</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Owner</th>
                  <th className="px-4 py-3.5 hidden lg:table-cell">Price</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginated.map(p => (
                  <tr
                    key={p.id}
                    className="group transition hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {getCoverImageUrl(p.images) ? (
                          <img src={getCoverImageUrl(p.images)!} alt={p.title} className="h-12 w-16 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                            <Building2 size={20} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{p.title}</p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
                            <MapPin size={10} />{p.location}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {p.type} · For {p.listingType}
                            {p.bedrooms != null && <> · <BedDouble size={10} className="inline" /> {p.bedrooms}</>}
                            {p.bathrooms != null && <> · <Bath size={10} className="inline" /> {p.bathrooms}</>}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.owner ? (
                        <div>
                          <p className="text-xs font-medium text-slate-300">{p.owner.full_name}</p>
                          <p className="text-xs text-slate-500">{p.owner.email}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">— admin</span>
                      )}
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs font-medium text-white">
                        {p.price.toLocaleString()} {p.currency}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.listingType === 'Rent' ? '/month' : 'sale'}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge verified={p.verified} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/properties/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition hover:border-slate-500 hover:text-white"
                          title="View public page"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button
                          onClick={() => handleVerify(p)}
                          disabled={actionLoading === p.id}
                          title={p.verified ? 'Un-verify' : 'Verify listing'}
                          className={`rounded-lg border p-1.5 transition ${
                            p.verified
                              ? 'border-emerald-700 text-emerald-400 hover:bg-emerald-950/30'
                              : 'border-slate-700 text-slate-400 hover:border-indigo-600 hover:text-indigo-400'
                          } disabled:opacity-40`}
                        >
                          {actionLoading === p.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : p.verified ? (
                            <ShieldOff size={13} />
                          ) : (
                            <ShieldCheck size={13} />
                          )}
                        </button>
                        <button
                          onClick={() => setEditId(p.id)}
                          className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition hover:border-slate-500 hover:text-white"
                          title="Edit property"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          disabled={actionLoading === p.id}
                          title="Delete property"
                          className="rounded-lg border border-slate-700 p-1.5 text-slate-400 transition hover:border-red-700 hover:text-red-400 disabled:opacity-40"
                        >
                          {actionLoading === p.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
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
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} properties
            </p>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      )}

      <AddPropertyModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        isAdminMode={true}
        onSaved={() => load()}
      />

      <AddPropertyModal
        open={editId !== null}
        onClose={() => setEditId(null)}
        isAdminMode={true}
        editId={editId}
        onSaved={() => load()}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete property"
        description={deleteTarget ? `Delete "${deleteTarget?.title}"? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}