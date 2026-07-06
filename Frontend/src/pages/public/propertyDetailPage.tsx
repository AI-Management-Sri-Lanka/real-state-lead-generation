import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, BedDouble, Bath, Ruler, MapPin, Building2,
  CheckCircle2, Loader2,
} from 'lucide-react'

import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID          = 'service_zx94q0s'
const EMAILJS_TEMPLATE_ID         = 'template_s0pzf6g'   // inquiry → agent
const EMAILJS_CONFIRM_TEMPLATE_ID = 'template_v2ux0ph'   // confirmation → user
const EMAILJS_PUBLIC_KEY          = 'd9YO9qHUQIn_CU9o-'

import { Property, InquiryPayload } from '@/types/property'
import { BASE_URL } from '@/api/config'


function formatPrice(price: number, currency: string, listingType: string) {
  const formatted = price.toLocaleString('en-US')
  return listingType === 'Rent'
    ? `${formatted} ${currency} / month`
    : `${formatted} ${currency}`
}

// Only letters, spaces, hyphens and apostrophes are valid in a name
// (covers names like "Anne-Marie" or "O'Brien").
const NAME_PATTERN = /^[A-Za-z\s'-]*$/

// Basic but solid email shape check: something@something.tld
// (rejects missing @, missing domain, etc.)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Sri Lankan phone numbers: either local (0 + 9 digits, e.g. 0771234567)
// or international (+94 + 9 digits, e.g. +94771234567).
const PHONE_PATTERN = /^(0\d{9}|\+94\d{9})$/

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [form, setForm]             = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperty() {
      if (!id) return
      try {
        setLoading(true)
        setFetchError(null)
        const res = await fetch(`${BASE_URL}/properties/${id}`)
        if (res.status === 404) {
          setFetchError('Property not found')
          return
        }
        if (!res.ok) {
          throw new Error(`Failed to load property: ${res.statusText}`)
        }
        const data = await res.json() as Property
        setProperty(data)
      } catch (err: unknown) {
        console.error(err)
        setFetchError(err instanceof Error ? err.message : 'Failed to connect to server')
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [id])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-page text-slate-100">
        <div className="text-center flex flex-col items-center gap-2">
          <Loader2 className="animate-spin text-brand" size={36} />
          <p className="text-sm text-slate-400">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (fetchError || !property) {
    return (
      <div className="grid min-h-screen place-items-center bg-page text-slate-100">
        <div className="text-center">
          <p className="text-lg font-semibold">{fetchError ?? 'Property not found'}</p>
          <Link to="/properties" className="mt-3 inline-block text-sm text-indigo-400 hover:underline">
            Back to listings
          </Link>
        </div>
      </div>
    )
  }

  function update<K extends keyof typeof form>(key: K, value: string) {
    // The name field should only ever contain letters, spaces, hyphens and
    // apostrophes — strip out anything else (digits, symbols) as it's typed
    // or pasted, so numeric input is never accepted in the first place.
    // The phone field should only ever contain digits, with an optional
    // leading "+" for the country code — strip letters and other symbols.
    let sanitized = value
    if (key === 'name') sanitized = value.replace(/[^A-Za-z\s'-]/g, '')
    if (key === 'phone') {
      const hasPlus = value.trim().startsWith('+')
      const digits = value.replace(/\D/g, '').slice(0, 11)
      sanitized = (hasPlus ? '+' : '') + digits
    }
    setForm(prev => ({ ...prev, [key]: sanitized }))
  }

  async function handleSubmit() {
    if (!property) return

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email and message.')
      return
    }

    if (!NAME_PATTERN.test(form.name.trim())) {
      setError('Name can only contain letters.')
      return
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) {
      setError('Please enter a valid phone number (e.g. 07X XXX XXXX or +94 7X XXX XXXX).')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      // ① Inquiry notification → agent only
      //    (make sure Auto-Reply is OFF on template_s0pzf6g in EmailJS dashboard)
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name:         form.name.trim(),
          from_email:        form.email.trim(),
          phone:             form.phone.trim() || 'Not provided',
          message:           form.message.trim(),
          property_title:    property.title,
          property_price:    `${property.price.toLocaleString()} ${property.currency}`,
          property_location: property.location,
        },
        EMAILJS_PUBLIC_KEY
      )

      // ② Confirmation receipt → user's typed email
      //    (To Email in template_v2ux0ph must be {{to_email}})
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_CONFIRM_TEMPLATE_ID,
        {
          to_name:           form.name.trim(),
          to_email:          form.email.trim(),
          property_title:    property.title,
          property_price:    `${property.price.toLocaleString()} ${property.currency}`,
          property_location: property.location,
        },
        EMAILJS_PUBLIC_KEY
      )

      // ③ Optionally log the inquiry to our own backend.
      //    This endpoint may not exist yet — a failure here shouldn't block
      //    the success UI, since the emails above are what actually matters.
      const payload: InquiryPayload = {
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim() || undefined,
        message: form.message.trim(),
        propertyId: property.id,
      }

      try {
        const res = await fetch(`${BASE_URL}/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Request failed')
      } catch {
        console.warn('Inquiry endpoint not available — showing mock success.')
      }

      setSubmitted(true)
    } catch (err) {
      console.error('EmailJS error:', err)
      setError('Failed to send inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-page text-slate-100">

      {/* ── Top nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-slate-950">
              <Building2 size={16} />
            </div>
            <span className="text-base font-semibold text-white">LeadAI Properties</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-slate-400">
            <Link to="/"           className="hover:text-white transition">Home</Link>
            <Link to="/properties" className="hover:text-white transition">Properties</Link>
            <Link to="/login"      className="hover:text-white transition">Sign in</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/properties')}
          className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={14} /> Back to listings
        </button>

        {/* Image placeholder */}
        {property.images && property.images.length > 0 ? (
          <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-slate-900 sm:h-96">
            <img
              src={property.images[0]}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-2xl bg-slate-900 text-slate-600 sm:h-72">
            <MapPin size={36} />
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">

          {/* ── Left: details ──────────────────────────────────── */}
          <div>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={12} /> {property.location}, Australia
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
              {formatPrice(property.price, property.currency, property.listingType)}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{property.title}</p>

            {/* Specs */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
              {property.bedrooms        != null && <span className="flex items-center gap-1.5"><BedDouble size={16} /> {property.bedrooms} bedrooms</span>}
              {property.bathrooms       != null && <span className="flex items-center gap-1.5"><Bath size={16} />      {property.bathrooms} bathrooms</span>}
              {property.areaSqft        != null && <span className="flex items-center gap-1.5"><Ruler size={16} />    {property.areaSqft} sqft</span>}
              {property.landSizePerches != null && <span className="flex items-center gap-1.5"><Ruler size={16} />    {property.landSizePerches} perches</span>}
            </div>

            <h3 className="mt-6 text-base font-semibold text-white">Description</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{property.description}</p>

            <h3 className="mt-6 text-base font-semibold text-white">Property details</h3>
            <div className="mt-2 divide-y divide-slate-800 rounded-2xl border border-slate-800">
              <Row label="Property type" value={property.type} />
              <Row label="Listing type"  value={`For ${property.listingType}`} />
              {property.furnishing && <Row label="Furnishing" value={property.furnishing} />}
              {property.parking    && <Row label="Parking"    value={property.parking} />}
              <Row label="Listed by" value={property.listedBy} />
            </div>
          </div>

          {/* ── Right: contact form ────────────────────────────── */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/90 p-5">
              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                  <p className="text-sm font-semibold text-white">Inquiry sent!</p>
                  <p className="text-xs text-slate-500">
                    Thanks {form.name.split(' ')[0]}! The listing agent will get back to you shortly.
                  </p>
                  <p className="text-xs text-indigo-400">
                    A confirmation email has been sent to {form.email}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-white">Interested in this property?</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Send a message and the listing agent will get back to you.
                  </p>

                  <div className="mt-4 space-y-3">
                    <Field label="Name"  placeholder="Your name"       value={form.name}    onChange={v => update('name', v)} />
                    <Field label="Email" placeholder="you@email.com"   value={form.email}   onChange={v => update('email', v)} type="email" />
                    <Field label="Phone" placeholder="+94 7X XXX XXXX" value={form.phone}   onChange={v => update('phone', v)} />
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Message</label>
                      <textarea
                        value={form.message}
                        onChange={e => update('message', e.target.value)}
                        placeholder="I'm interested in this property and would like to schedule a viewing."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>

                    {error && <p className="text-xs text-red-400">{error}</p>}

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {submitting && <Loader2 size={14} className="animate-spin" />}
                      {submitting ? 'Sending…' : 'Send inquiry'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  )
}

function Field({
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
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500"
      />
    </div>
  )
}