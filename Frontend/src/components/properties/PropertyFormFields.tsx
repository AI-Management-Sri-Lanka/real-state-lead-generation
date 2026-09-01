import { Plus, X, UploadCloud } from 'lucide-react'
import { Select as CustomSelect } from '@/components/ui/Select'
import { PropertyFormState } from '@/hooks/usePropertyForm'

type PropertyFormFieldsProps = {
  form: PropertyFormState
  set: <K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]) => void
  imageInput: string
  setImageInput: (value: string) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  isDragging: boolean
  isUploading?: boolean
  uploadError: string | null
  handleAddButtonClick: () => void
  removeImage: (idx: number) => void
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  fieldErrors?: { phoneNumber?: string }
}

export function PropertyFormFields({
  form, set, imageInput, setImageInput, fileInputRef, isDragging, isUploading, uploadError,
  handleAddButtonClick, removeImage, handleDrop, handleDragOver, handleDragLeave, handleFileInputChange,
  fieldErrors,
}: PropertyFormFieldsProps) {
  return (
    <div className="space-y-8">

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
          <CustomSelect label="Property type" value={form.type} onChange={v => set('type', v)} options={['Apartment', 'House', 'Land', 'Commercial']} />
          <label className="flex cursor-pointer select-none items-center gap-2">
            <div onClick={() => set('verified', !form.verified)} className={`relative h-5 w-9 rounded-full transition ${form.verified ? 'bg-emerald-500' : 'bg-slate-200 shadow-inner dark:bg-slate-700'}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${form.verified ? 'left-4' : 'left-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mark as verified</span>
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
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Listed by *" placeholder="Agent or owner name" value={form.listedBy} onChange={v => set('listedBy', v)} />
            <TextInput label="Phone number" placeholder="e.g. 0412345678" value={form.phoneNumber} onChange={v => set('phoneNumber', v)} error={fieldErrors?.phoneNumber} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe the property…" rows={4}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </FieldGroup>
      </Section>

      {/* Images */}
      <Section title="Images">
        <FieldGroup>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste an image URL and click Add — or leave it blank and click Add to upload from your device. You can also drag files onto this box.
          </p>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex gap-2 rounded-xl border p-1 transition ${
              isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-transparent'
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
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <button
              onClick={handleAddButtonClick}
              disabled={isUploading}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
            >
              {isUploading ? <span className="animate-spin text-lg block h-4 w-4 rounded-full border-2 border-slate-400 border-t-indigo-600"></span> : (imageInput.trim() ? <Plus size={16} /> : <UploadCloud size={16} />)}
              {isUploading ? 'Uploading...' : (imageInput.trim() ? 'Add' : 'Upload')}
            </button>
          </div>

          {isDragging && (
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Drop image files anywhere in that box to upload.</p>
          )}
          {uploadError && (
            <p className="text-xs font-medium text-red-500 dark:text-red-400">{uploadError}</p>
          )}

          {/* Image previews with thumbnails */}
          {form.images.length > 0 && (
            <ul className="space-y-2 mt-4">
              {form.images.map((url, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <img
                    src={url} alt=""
                    className="h-12 w-16 shrink-0 rounded-lg object-cover bg-slate-100 border border-slate-200 dark:bg-slate-700 dark:border-slate-600"
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
                  />
                  <span className="flex-1 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                    {url.startsWith('data:') ? `Uploaded image ${i + 1}` : url}
                  </span>
                  {i === 0 && (
                    <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      Primary
                    </span>
                  )}
                  <button onClick={() => removeImage(i)} className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition dark:hover:bg-red-950/40 dark:hover:text-red-400">
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </FieldGroup>
      </Section>

    </div>
  )
}

// ── Layout helpers ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">{children}</div>
    </div>
  )
}
function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}
function TextInput({ label, value, onChange, placeholder, type = 'text', error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; error?: string | undefined
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500" />
      {error && <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
