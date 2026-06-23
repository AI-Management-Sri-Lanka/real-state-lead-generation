import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Building2, Loader2, CheckCircle2, Plus, X,
} from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ── Simple admin gate 
// Replace this with your real auth check (e.g. read role from JWT / context)
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
  images: string[]      // list of image URLs
}

const EMPTY: FormState = {
  title: '',
  price: '',
  currency: 'LKR',
  location: '',
  bedrooms: '',
  bathrooms: '',
  areaSqft: '',
  landSizePerches: '',
  type: 'Apartment',
  listingType: 'Sale',
  verified: false,
  furnishing: '',
  parking: '',
  listedBy: '',
  description: '',
  images: [],
}

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
        <p className="mb-4 text-xs text-slate-500">
          Enter the admin password to manage property listings.
        </p>
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="Password"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500"
        />
        {err && <p className="mt-2 text-xs text-red-400">Incorrect password.</p>}
        <button
          onClick={check}
          className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminAddPropertyPage() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [imageInput, setImageInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!authed) return <AdminGate onAuth={() => setAuthed(true)} />

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

  async function handleSubmit() {
    // Basic validation
    if (!form.title.trim() || !form.price || !form.location.trim() || !form.listedBy.trim()) {
      setError('Title, price, location and listed-by are required.')
      return
    }
    setError(null)
    setSubmitting(true)

    const payload = {
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
      images: form.images,
    }

    try {
      const res = await fetch(`${BASE_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Server error: ${res.statusText}`)
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save property.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={48} className="text-emerald-400" />
          <p className="text-xl font-semibold text-white">Property added!</p>
          <p className="text-sm text-slate-400">It will appear in the public listings shortly.</p>
          <div className="mt-2 flex gap-3">
            <button
              onClick={() => { setForm(EMPTY); setSubmitted(false) }}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
            >
              Add another
            </button>
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Building2 size={16} />
            </div>
            <span className="text-sm font-semibold text-white">LeadAI Admin</span>
          </Link>
          <button
            onClick={() => navigate('/properties')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={14} /> Back to listings
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-xl font-semibold text-white">Add new property</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the details below. Required fields are marked with *.
        </p>

        <div className="mt-8 space-y-8">

          {/* ── Section: Core info ───────────────────────────────── */}
          <Section title="Core info">
            <FieldGroup>
              <TextInput
                label="Title *"
                placeholder="e.g. Spacious 3BR House in Nugegoda"
                value={form.title}
                onChange={v => set('title', v)}
              />
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Price *"
                  placeholder="e.g. 25000000"
                  type="number"
                  value={form.price}
                  onChange={v => set('price', v)}
                />
                <SelectInput
                  label="Currency"
                  value={form.currency}
                  onChange={v => set('currency', v)}
                  options={['LKR', 'USD']}
                />
              </div>
              <TextInput
                label="Location *"
                placeholder="e.g. Colombo 07"
                value={form.location}
                onChange={v => set('location', v)}
              />
            </FieldGroup>
          </Section>

          {/* ── Section: Listing type ────────────────────────────── */}
          <Section title="Listing type">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <SelectInput
                  label="Property type"
                  value={form.type}
                  onChange={v => set('type', v)}
                  options={['Apartment', 'House', 'Land', 'Villa', 'Commercial']}
                />
                <SelectInput
                  label="For"
                  value={form.listingType}
                  onChange={v => set('listingType', v)}
                  options={['Sale', 'Rent']}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => set('verified', !form.verified)}
                  className={`relative h-5 w-9 rounded-full transition ${form.verified ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${form.verified ? 'left-4' : 'left-0.5'}`}
                  />
                </div>
                <span className="text-sm text-slate-300">Mark as verified</span>
              </label>
            </FieldGroup>
          </Section>

          {/* ── Section: Specs ───────────────────────────────────── */}
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

          {/* ── Section: Details ─────────────────────────────────── */}
          <Section title="Details">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <SelectInput
                  label="Furnishing"
                  value={form.furnishing}
                  onChange={v => set('furnishing', v)}
                  options={['', 'Fully-Furnished', 'Semi-Furnished', 'Unfurnished']}
                  placeholder="Select (optional)"
                />
                <TextInput
                  label="Parking"
                  placeholder="e.g. 1 Covered Parking"
                  value={form.parking}
                  onChange={v => set('parking', v)}
                />
              </div>
              <TextInput
                label="Listed by *"
                placeholder="Agent or owner name"
                value={form.listedBy}
                onChange={v => set('listedBy', v)}
              />
              <div>
                <label className="mb-1 block text-xs text-slate-500">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe the property…"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 transition"
                />
              </div>
            </FieldGroup>
          </Section>

          {/* ── Section: Images ──────────────────────────────────── */}
          <Section title="Images">
            <FieldGroup>
              <p className="text-xs text-slate-500">Add image URLs one at a time.</p>
              <div className="flex gap-2">
                <input
                  value={imageInput}
                  onChange={e => setImageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addImage()}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 transition"
                />
                <button
                  onClick={addImage}
                  className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              {form.images.length > 0 && (
                <ul className="space-y-2">
                  {form.images.map((url, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">
                      <span className="truncate">{url}</span>
                      <button onClick={() => removeImage(i)} className="shrink-0 text-slate-600 hover:text-red-400 transition">
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FieldGroup>
          </Section>

        </div>

        {/* ── Submit ─────────────────────────────────────────────── */}
        {error && (
          <p className="mt-6 rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}
        <div className="mt-8 flex justify-end gap-3 pb-12">
          <button
            onClick={() => navigate('/properties')}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Saving…' : 'Save property'}
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
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        {children}
      </div>
    </div>
  )
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

function TextInput({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500 transition"
      />
    </div>
  )
}

function SelectInput({
  label, value, onChange, options, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500 transition"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}