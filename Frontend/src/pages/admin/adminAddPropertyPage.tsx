import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Building2, Loader2, CheckCircle2, Plus, X, UploadCloud } from 'lucide-react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { addProperty, editProperty, addPropertyImage, fetchProperty, PropertyPayload } from '@/app/be/adminProperty/[action]'

const ADMIN_PASSWORD = 'admin123'

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
  title: '', price: '', currency: 'LKR', location: '',
  bedrooms: '', bathrooms: '', areaSqft: '', landSizePerches: '',
  type: 'Apartment', listingType: 'Sale', verified: false,
  furnishing: '', parking: '', listedBy: '', description: '', images: [],
}

const MAX_FILE_MB = 5

// ── Auth gate ──────────────────────────────────────────────────────────────
function AdminGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  function check() {
    if (pw === ADMIN_PASSWORD) { onAuth() }
    else { setErr(true); setPw('') }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Building2 size={16} />
          </div>
          <span className="text-sm font-semibold text-white">Admin access</span>
        </div>
        <p className="mb-4 text-xs text-slate-500">Enter the admin password to manage listings.</p>
        <input
          type="password" value={pw} autoFocus
          onChange={e => { setPw(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Password"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500"
        />
        {err && <p className="mt-2 text-xs text-red-400">Incorrect password.</p>}
        <button onClick={check} className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500">
          Continue
        </button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminAddPropertyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('id')
  const isEditMode = Boolean(editId)

  const [authed, setAuthed] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
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
    if (!authed || !editId) return
    async function load() {
      setLoadingProperty(true)
      try {
        const p = await fetchProperty(editId!)
        setForm({
          title: p.title ?? '',
          price: p.price != null ? String(p.price) : '',
          currency: p.currency ?? 'LKR',
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
  }, [authed, editId])

  if (!authed) return <AdminGate onAuth={() => setAuthed(true)} />

  if (loadingProperty) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin text-indigo-400" />
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
      if (isEditMode) {
        await editProperty(editId!, payload)
        propertyId = editId!
      } else {
        const created = await addProperty(payload)
        propertyId = String(created.id)
      }

      const newImageUrls = allImages.filter(url => !originalImageUrls.includes(url))
      const startIndex = originalImageUrls.length
      for (let i = 0; i < newImageUrls.length; i++) {
        await addPropertyImage(propertyId, {
          url: newImageUrls[i],
          isPrimary: startIndex + i === 0,
          sortOrder: startIndex + i,
        })
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
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={48} className="text-emerald-400" />
          <p className="text-xl font-semibold text-white">
            {isEditMode ? 'Property updated!' : 'Property added!'}
          </p>
          <p className="text-sm text-slate-400">
            {isEditMode ? 'Your changes have been saved.' : 'It will appear in the listings shortly.'}
          </p>
          <div className="mt-2 flex gap-3">
            {!isEditMode && (
              <button
                onClick={() => { setForm(EMPTY); setSubmitted(false) }}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
              >
                Add another
              </button>
            )}
            <button
              onClick={() => navigate('/properties')}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
            >
              View listings
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Building2 size={16} />
            </div>
            <span className="text-sm font-semibold text-white">LeadAI Admin</span>
          </Link>
          <button
            onClick={() => navigate('/properties')}
            className="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={14} /> Back to listings
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-xl font-semibold text-white">
          {isEditMode ? 'Edit property' : 'Add new property'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEditMode ? `Editing ${editId}. ` : ''}Required fields are marked with *.
        </p>

        <div className="mt-8 space-y-8">

          {/* Core info */}
          <Section title="Core info">
            <FieldGroup>
              <TextInput label="Title *" placeholder="e.g. Spacious 3BR House in Nugegoda" value={form.title} onChange={v => set('title', v)} />
              <div className="grid grid-cols-2 gap-4">
                <TextInput label="Price *" placeholder="e.g. 25000000" type="number" value={form.price} onChange={v => set('price', v)} />
                <SelectInput label="Currency" value={form.currency} onChange={v => set('currency', v)} options={['LKR', 'USD']} />
              </div>
              <TextInput label="Location *" placeholder="e.g. Colombo 07" value={form.location} onChange={v => set('location', v)} />
            </FieldGroup>
          </Section>

          {/* Listing type */}
          <Section title="Listing type">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <SelectInput label="Property type" value={form.type} onChange={v => set('type', v)} options={['Apartment', 'House', 'Land', 'Commercial']} />
                <SelectInput label="For" value={form.listingType} onChange={v => set('listingType', v)} options={['Sale', 'Rent']} />
              </div>
              <label className="flex cursor-pointer select-none items-center gap-2">
                <div onClick={() => set('verified', !form.verified)} className={`relative h-5 w-9 rounded-full transition ${form.verified ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${form.verified ? 'left-4' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-slate-300">Mark as verified</span>
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
                <SelectInput label="Furnishing" value={form.furnishing} onChange={v => set('furnishing', v)} options={['', 'Fully-Furnished', 'Semi-Furnished', 'Unfurnished']} placeholder="Select (optional)" />
                <TextInput label="Parking" placeholder="e.g. 1 Covered Parking" value={form.parking} onChange={v => set('parking', v)} />
              </div>
              <TextInput label="Listed by *" placeholder="Agent or owner name" value={form.listedBy} onChange={v => set('listedBy', v)} />
              <div>
                <label className="mb-1 block text-xs text-slate-500">Description</label>
                <textarea
                  value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Describe the property…" rows={4}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500"
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
                  isDragging ? 'border-indigo-500 bg-indigo-950/20' : 'border-transparent'
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
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500"
                />
                <button
                  onClick={handleAddButtonClick}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
                >
                  {imageInput.trim() ? <Plus size={14} /> : <UploadCloud size={14} />}
                  {imageInput.trim() ? 'Add' : 'Upload'}
                </button>
              </div>

              {isDragging && (
                <p className="text-xs text-indigo-400">Drop image files anywhere in that box to upload.</p>
              )}
              {uploadError && (
                <p className="text-xs text-red-400">{uploadError}</p>
              )}

              {/* Image previews with thumbnails */}
              {form.images.length > 0 && (
                <ul className="space-y-2">
                  {form.images.map((url, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                      <img
                        src={url} alt=""
                        className="h-10 w-14 shrink-0 rounded-lg object-cover bg-slate-800"
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
                      />
                      <span className="flex-1 truncate text-xs text-slate-400">
                        {url.startsWith('data:') ? `Uploaded image ${i + 1}` : url}
                      </span>
                      {i === 0 && (
                        <span className="shrink-0 rounded-full bg-indigo-950/60 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                          Primary
                        </span>
                      )}
                      <button onClick={() => removeImage(i)} className="shrink-0 text-slate-600 transition hover:text-red-400">
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FieldGroup>
          </Section>

        </div>

        {error && (
          <p className="mt-6 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</p>
        )}
        <div className="mt-8 flex justify-end gap-3 pb-12">
          <button onClick={() => navigate('/properties')} className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
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
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</h2>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">{children}</div>
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
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500" />
    </div>
  )
}
function SelectInput({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none transition focus:border-indigo-500">
        {placeholder && <option value="">{placeholder}</option>}
        {options.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}