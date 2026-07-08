import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Building2, Loader2, CheckCircle2, Plus, X, UploadCloud } from 'lucide-react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { propertyApi, adminPropertyApi, PropertyPayload } from '@/api/propertyApi'
import { Select as CustomSelect } from '@/components/ui/Select'

type FormState = {
  title: string
  price: string
  currency: string
  location: string
  bedrooms: string
  bathrooms: string
  areaSqft: string
  landSizePerches: string
  type: string
  listingType: string
  verified: boolean
  furnishing: string
  parking: string
  listedBy: string
  description: string
  images: string[]
}

const EMPTY: FormState = {
  title: '', price: '', currency: 'AUD', location: '',
  bedrooms: '', bathrooms: '', areaSqft: '', landSizePerches: '',
  type: 'Apartment', listingType: 'Sale', verified: false,
  furnishing: '', parking: '', listedBy: '', description: '', images: [],
}

const MAX_FILE_MB = 5

// ── Main page ──────────────────────────────────────────────────────────────
export default function PropertyManager() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  const isEditMode = Boolean(editId)
  const isAdminMode = window.location.pathname.startsWith('/admin')


  const [form, setForm] = useState<FormState>(EMPTY)
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null)
  
  const actualEditId = editId || createdPropertyId
  const isActuallyEditMode = Boolean(actualEditId)

  const [imageInput, setImageInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingProperty, setLoadingProperty] = useState(false)
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing property in edit mode
  useEffect(() => {
    if (!editId) return
    async function load() {
      setLoadingProperty(true)
      try {
        const p = isAdminMode
          ? await adminPropertyApi.getOne(editId!)
          : await propertyApi.getProperty(editId!)
        setForm({
          title: p.title ?? '',
          price: p.price != null ? String(p.price) : '',
          currency: p.currency ?? 'AUD',
          location: p.location ?? '',
          bedrooms: p.bedrooms != null ? String(p.bedrooms) : '',
          bathrooms: p.bathrooms != null ? String(p.bathrooms) : '',
          areaSqft: p.areaSqft != null ? String(p.areaSqft) : '',
          landSizePerches: p.landSizePerches != null ? String(p.landSizePerches) : '',
          type: p.type ?? 'Apartment',
          listingType: p.listingType ?? 'Sale',
          verified: p.verified ?? false,
          furnishing: p.furnishing ?? '',
          parking: p.parking ?? '',
          listedBy: p.listedBy ?? '',
          description: p.description ?? '',
          images: Array.isArray(p.images) ? p.images : [],
        })
        setOriginalImageUrls(Array.isArray(p.images) ? p.images : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property.')
      } finally {
        setLoadingProperty(false)
      }
    }
    load()
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

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function addImage() {
    const url = imageInput.trim()
    if (!url) return
    set('images', [...form.images, url])
    setImageInput('')
  }

  function removeImage(idx: number) {
    set('images', form.images.filter((_, i) => i !== idx))
  }

  function handleAddButtonClick() {
    const url = imageInput.trim()
    if (url) {
      addImage()
    } else {
      fileInputRef.current?.click()
    }
  }

  // Converts a File to a base64 data URL. Swap this for a real upload
  // call (POST multipart -> hosted URL) if the backend adds one later.
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`))
      reader.readAsDataURL(file)
    })
  }

  async function handleFiles(fileList: FileList | File[]) {
    setUploadError(null)
    const files = Array.from(fileList)

    const validFiles = files.filter(f => {
      if (!f.type.startsWith('image/')) return false
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        setUploadError(`"${f.name}" is over ${MAX_FILE_MB}MB and was skipped.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    try {
      const dataUrls = await Promise.all(validFiles.map(fileToDataUrl))
      set('images', [...form.images, ...dataUrls])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to read one or more files.')
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) handleFiles(e.target.files)
    e.target.value = ''
  }

  // handleSubmit — payload no longer carries images, and we attach them after
  async function handleSubmit() {
    // auto-include any URL still sitting in the input that wasn't explicitly "Added"
    const pendingUrl = imageInput.trim()
    const allImages = pendingUrl && !form.images.includes(pendingUrl)
      ? [...form.images, pendingUrl]
      : form.images

    if (!form.title.trim() || !form.price || !form.location.trim() || !form.listedBy.trim()) {
      setError('Title, price, location and listed-by are required.')
      return
    }
    setError(null)
    setSubmitting(true)

    const payload: PropertyPayload = {
      title: form.title.trim(),
      price: Number(form.price),
      currency: form.currency,
      location: form.location.trim(),
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      areaSqft: form.areaSqft ? Number(form.areaSqft) : null,
      landSizePerches: form.landSizePerches ? Number(form.landSizePerches) : null,
      type: form.type,
      listingType: form.listingType,
      verified: form.verified,
      furnishing: form.furnishing.trim() || null,
      parking: form.parking.trim() || null,
      listedBy: form.listedBy.trim(),
      description: form.description.trim(),
    }

    try {
      let propertyId: string
      if (isActuallyEditMode) {
        if (isAdminMode) {
          await adminPropertyApi.edit(actualEditId!, payload)
        } else {
          await propertyApi.editProperty(actualEditId!, payload)
        }
        propertyId = actualEditId!
      } else {
        if (isAdminMode) {
          const created = await adminPropertyApi.create(payload)
          propertyId = String(created.id)
        } else {
          const created = await propertyApi.addProperty(payload)
          propertyId = String(created.id)
        }
        setCreatedPropertyId(propertyId)
      }

      const newImageUrls = allImages.filter(url => !originalImageUrls.includes(url))
      const startIndex = originalImageUrls.length
      for (let i = 0; i < newImageUrls.length; i++) {
        if (isAdminMode) {
          await adminPropertyApi.addPropertyImage(propertyId, {
            url: newImageUrls[i],
            isPrimary: startIndex + i === 0,
            sortOrder: startIndex + i,
          })
        } else {
          await propertyApi.addPropertyImage(propertyId, {
            url: newImageUrls[i],
            isPrimary: startIndex + i === 0,
            sortOrder: startIndex + i,
          })
        }
      }

      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save property.')
    } finally {
      setSubmitting(false)
    }
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
                onClick={() => { setForm(EMPTY); setCreatedPropertyId(null); setSubmitted(false) }}
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

        <div className="mt-8 space-y-8">

          {/* Core info */}
          <Section title="Core info">
            <FieldGroup>
              <TextInput label="Title *" placeholder="e.g. Spacious 3BR House in Sydney" value={form.title} onChange={v => set('title', v)} />
              <div className="grid grid-cols-2 gap-4">
                <TextInput label="Price *" placeholder="e.g. 1500000" type="number" value={form.price} onChange={v => set('price', v)} />
                <CustomSelect label="Currency" value={form.currency} onChange={v => set('currency', v)} options={['AUD', 'USD', 'LKR']} />
              </div>
              <TextInput label="Location *" placeholder="e.g. Sydney CBD" value={form.location} onChange={v => set('location', v)} />
            </FieldGroup>
          </Section>

          {/* Listing type */}
          <Section title="Listing type">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <CustomSelect label="Property type" value={form.type} onChange={v => set('type', v)} options={['Apartment', 'House', 'Land', 'Commercial']} />
                <CustomSelect label="For" value={form.listingType} onChange={v => set('listingType', v)} options={['Sale', 'Rent']} />
              </div>
              <label className="flex cursor-pointer select-none items-center gap-2">
                <div onClick={() => set('verified', !form.verified)} className={`relative h-5 w-9 rounded-full transition ${form.verified ? 'bg-emerald-500' : 'bg-slate-200 shadow-inner'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${form.verified ? 'left-4' : 'left-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">Mark as verified</span>
              </label>
            </FieldGroup>
          </Section>

          {/* Specs */}
          <Section title="Specs">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <TextInput label="Bedrooms" placeholder="e.g. 3" type="number" value={form.bedrooms} onChange={v => set('bedrooms', v)} />
                <TextInput label="Bathrooms" placeholder="e.g. 2" type="number" value={form.bathrooms} onChange={v => set('bathrooms', v)} />
                <TextInput label="Area (sqft)" placeholder="e.g. 1200" type="number" value={form.areaSqft} onChange={v => set('areaSqft', v)} />
                <TextInput label="Land (perches)" placeholder="e.g. 10" type="number" value={form.landSizePerches} onChange={v => set('landSizePerches', v)} />
              </div>
            </FieldGroup>
          </Section>

          {/* Details */}
          <Section title="Details">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <CustomSelect label="Furnishing" value={form.furnishing} onChange={v => set('furnishing', v)} options={['Fully-Furnished', 'Semi-Furnished', 'Unfurnished']} placeholder="Select (optional)" />
                <TextInput label="Parking" placeholder="e.g. 1 Covered Parking" value={form.parking} onChange={v => set('parking', v)} />
              </div>
              <TextInput label="Listed by *" placeholder="Agent or owner name" value={form.listedBy} onChange={v => set('listedBy', v)} />
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Description</label>
                <textarea
                  value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Describe the property…" rows={4}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>
            </FieldGroup>
          </Section>

          {/* Images */}
          <Section title="Images">
            <FieldGroup>
              <p className="text-xs text-slate-500">
                Paste an image URL and click Add — or leave it blank and click Add to upload from your device. You can also drag files onto this box.
              </p>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex gap-2 rounded-xl border p-1 transition ${
                  isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-transparent'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  value={imageInput} onChange={e => setImageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddButtonClick()}
                  placeholder="https://example.com/image.jpg — or leave blank to upload"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
                <button
                  onClick={handleAddButtonClick}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 transition hover:bg-slate-200"
                >
                  {imageInput.trim() ? <Plus size={16} /> : <UploadCloud size={16} />}
                  {imageInput.trim() ? 'Add' : 'Upload'}
                </button>
              </div>

              {isDragging && (
                <p className="text-xs font-medium text-indigo-600">Drop image files anywhere in that box to upload.</p>
              )}
              {uploadError && (
                <p className="text-xs font-medium text-red-500">{uploadError}</p>
              )}

              {/* Image previews with thumbnails */}
              {form.images.length > 0 && (
                <ul className="space-y-2 mt-4">
                  {form.images.map((url, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <img
                        src={url} alt=""
                        className="h-12 w-16 shrink-0 rounded-lg object-cover bg-slate-100 border border-slate-200"
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
                      />
                      <span className="flex-1 truncate text-xs font-medium text-slate-600">
                        {url.startsWith('data:') ? `Uploaded image ${i + 1}` : url}
                      </span>
                      {i === 0 && (
                        <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          Primary
                        </span>
                      )}
                      <button onClick={() => removeImage(i)} className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FieldGroup>
          </Section>

        </div>

        {error && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
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

// ── Layout helpers ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
    </div>
  )
}
function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}
function TextInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm" />
    </div>
  )
}