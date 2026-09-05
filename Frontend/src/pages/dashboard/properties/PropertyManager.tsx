import { useEffect, useState } from 'react'
import { ArrowLeft, Building2, Loader2, CheckCircle2 } from 'lucide-react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { getOwnerInquiries, Inquiry } from '@/api/inquiryApi'
import { Inbox, Calendar, User, Mail, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { usePropertyForm } from '@/hooks/usePropertyForm'
import { PropertyFormFields } from '@/components/properties/PropertyFormFields'

// ── Main page ──────────────────────────────────────────────────────────────
export default function PropertyManager() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  const isAdminMode = window.location.pathname.startsWith('/admin')

  const {
    form, set,
    isEditMode, isActuallyEditMode,
    imageInput, setImageInput,
    submitting, submitted, error,
    loadingProperty,
    isDragging, uploadError,
    fileInputRef,
    handleAddButtonClick, removeImage,
    handleDrop, handleDragOver, handleDragLeave, handleFileInputChange,
    handleSubmit, resetForm,
  } = usePropertyForm({ editId, isAdminMode })

  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loadingInquiries, setLoadingInquiries] = useState(false)

  useEffect(() => {
    if (!editId) return
    async function loadInquiries() {
      setLoadingInquiries(true)
      try {
        const idNum = parseInt(editId!.replace('prop-', ''), 10)
        const data = await getOwnerInquiries(idNum)
        setInquiries(data)
      } catch (err) {
        console.error("Failed to load inquiries", err)
      } finally {
        setLoadingInquiries(false)
      }
    }
    loadInquiries()
  }, [editId])

  if (loadingProperty) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={28} className="animate-spin text-indigo-600" />
          <p className="text-sm">Loading property…</p>
        </div>
      </div>
    )
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={48} className="text-emerald-500" />
          <p className="text-xl font-semibold text-slate-900">
            {isEditMode ? 'Property updated!' : 'Property added!'}
          </p>
          <p className="text-sm text-slate-500">
            {isEditMode ? 'Your changes have been saved.' : 'It will appear in the listings shortly.'}
          </p>
          <div className="mt-2 flex gap-3">
            {!isActuallyEditMode && (
              <button
                onClick={resetForm}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Add another
              </button>
            )}
            <button
              onClick={() => navigate(isAdminMode ? '/admin/properties' : '/dashboard/properties')}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
            >
              {isAdminMode ? 'Back to Property Management' : 'Back to My Properties'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/auth/signup" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Building2 size={16} />
            </div>
            <span className="text-sm font-semibold text-slate-900">LeadAI Admin</span>
          </Link>
          <button
            onClick={() => navigate(isAdminMode ? '/admin/properties' : '/dashboard/properties')}
            className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditMode ? 'Edit property' : 'Add new property'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEditMode ? `Editing ${editId}. ` : ''}Required fields are marked with *.
        </p>

        <div className="mt-8">
          <PropertyFormFields
            form={form}
            set={set}
            imageInput={imageInput}
            setImageInput={setImageInput}
            fileInputRef={fileInputRef}
            isDragging={isDragging}
            uploadError={uploadError}
            handleAddButtonClick={handleAddButtonClick}
            removeImage={removeImage}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleFileInputChange={handleFileInputChange}
          />
        </div>

        {error && (
          <p
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium"
            style={{ color: 'var(--color-error, #DC2626)' }}
          >{error}</p>
        )}

        {isEditMode && (
          <div className="mt-12">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Property Inquiries</h2>
            {loadingInquiries ? (
               <div className="flex items-center justify-center py-10">
                 <Loader2 size={24} className="animate-spin text-indigo-500" />
               </div>
            ) : inquiries.length === 0 ? (
               <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                 <Inbox size={32} className="mx-auto text-slate-400 mb-3" />
                 <p className="text-slate-500 text-sm">No inquiries received for this property yet.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                            {inquiry.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                              <User size={16} className="text-slate-400" />
                              {inquiry.name}
                            </h3>
                            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <Calendar size={14} className="text-slate-400" />
                              {format(new Date(inquiry.createdAt.endsWith('Z') ? inquiry.createdAt : inquiry.createdAt + 'Z'), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail size={16} className="text-slate-400" />
                            <a href={`mailto:${inquiry.email}`} className="hover:text-indigo-600 transition">{inquiry.email}</a>
                          </div>
                          {inquiry.phone && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone size={16} className="text-slate-400" />
                              <a href={`tel:${inquiry.phone}`} className="hover:text-indigo-600 transition">{inquiry.phone}</a>
                            </div>
                          )}
                        </div>
                      </div>

                      {inquiry.message && (
                        <div className="lg:w-1/2 rounded-xl bg-slate-50 p-4 border border-slate-100 text-sm text-slate-600 whitespace-pre-wrap">
                          {inquiry.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3 pb-12">
          <button onClick={() => navigate('/dashboard/properties')} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? (isEditMode ? 'Updating…' : 'Saving…') : (isEditMode ? 'Update property' : 'Save property')}
          </button>
        </div>
      </div>
    </div>
  )
}