import { useState, useEffect, useCallback } from 'react'
import { Building2, Plus, Loader2, Search } from 'lucide-react'
import { propertyApi } from '@/api/propertyApi'
import { Property } from '@/types/property'
import { PropertyCard } from '@/components/properties/propertyCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuth } from '@/hooks/useAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AddPropertyModal } from '@/components/properties/AddPropertyModal'

export default function MyPropertiesList() {
  const { user } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      // Fetch properties owned by current user
      const data = await propertyApi.getProperties({ ownerId: user.id, limit: 100 })
      setProperties(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading properties')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map(p => (
              <PropertyCard
                key={p.id}
                property={p}
                onEdit={() => setEditId(p.id)}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
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
