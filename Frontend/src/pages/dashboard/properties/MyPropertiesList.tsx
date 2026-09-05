import { useState, useEffect, useCallback, useMemo } from 'react'
import { Building2, Plus, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { propertyApi } from '@/api/propertyApi'
import { Property } from '@/types/property'
import { PropertyCard } from '@/components/properties/propertyCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AddPropertyModal } from '@/components/properties/AddPropertyModal'

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 12 // 3 full rows at the widest (xl:grid-cols-4) breakpoint

/** Builds a compact page-number list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 12 */
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
    <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-4" aria-label="Properties pagination">
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

export default function MyPropertiesList() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      // The backend caps `limit` at 100 per request, so an owner with more
      // than 100 listings would silently get truncated with a single call.
      // Page through the API (skip/limit) until a short page comes back, so
      // "My Properties" always has the complete list to paginate over.
      const FETCH_BATCH = 100
      const all: Property[] = []
      let skip = 0
      while (true) {
        const batch = await propertyApi.getProperties({ ownerId: user.id, limit: FETCH_BATCH, skip })
        all.push(...batch)
        if (batch.length < FETCH_BATCH) break
        skip += FETCH_BATCH
      }
      setProperties(all)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading properties')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  // Snap back to page 1 whenever the underlying list changes (fresh load,
  // add, delete) so we never strand the admin on a now-empty page.
  useEffect(() => {
    setPage(1)
  }, [properties.length])

  const totalPages = Math.max(1, Math.ceil(properties.length / PAGE_SIZE))
  const paginated = useMemo(
    () => properties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [properties, page]
  )

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await propertyApi.deleteProperty(deleteTarget.id)
      setProperties(prev => prev.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      alert('Error deleting property.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DashboardLayout activeNav="Properties">
      <div className="flex flex-1 flex-col bg-slate-950 min-h-full">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-6">
        <h1 className="text-lg font-semibold text-slate-100">My Properties</h1>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          <Plus size={16} /> Add Property
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-900 bg-red-950/20 p-6 text-center text-red-400">
            {error}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-slate-700">
              <Building2 size={32} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">No properties yet</h3>
            <p className="mt-1 text-sm text-slate-500">You haven't listed any properties.</p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="mt-6 flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              <Plus size={16} /> Create your first listing
            </button>
          </div>
        ) : (
          <div className="flex min-h-full flex-col">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map(p => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onEdit={() => setEditId(p.id)}
                  onDelete={() => setDeleteTarget(p)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-auto flex flex-col items-center gap-2 pt-10">
                <p className="text-xs text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, properties.length)} of {properties.length} properties
                </p>
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      <AddPropertyModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        isAdminMode={false}
        onSaved={() => load()}
      />

      <AddPropertyModal
        open={editId !== null}
        onClose={() => setEditId(null)}
        isAdminMode={false}
        editId={editId}
        onSaved={() => load()}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete property"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  )
}