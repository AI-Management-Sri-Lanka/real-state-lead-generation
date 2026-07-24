import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft, BedDouble, Bath, Ruler, MapPin,
  CheckCircle2, Loader2, ShieldCheck, User, Mail, Phone,
} from 'lucide-react'

import emailjs from '@emailjs/browser'
import { useFormik } from 'formik'
import * as Yup from 'yup'

import { Navbar } from '@/pages/home/components/Navbar'
import { Footer } from '@/pages/home/components/Footer'

const EMAILJS_SERVICE_ID          = 'service_zx94q0s'
const EMAILJS_TEMPLATE_ID         = 'template_s0pzf6g'   // inquiry → agent
const EMAILJS_CONFIRM_TEMPLATE_ID = 'template_v2ux0ph'   // confirmation → user
const EMAILJS_PUBLIC_KEY          = 'd9YO9qHUQIn_CU9o-'

import { Property, InquiryPayload } from '@/types/property'
import { propertyApi } from '@/api/propertyApi'
import { useAuth } from '@/hooks/useAuth'
import { BASE_URL } from '@/api/config'
import { getOwnerInquiries, Inquiry } from '@/api/inquiryApi'
import { format } from 'date-fns'


function formatPrice(price: number, currency: string, listingType: string) {
  const formatted = price.toLocaleString('en-US')
  return listingType === 'Rent'
    ? `${formatted} ${currency} / month`
    : `${formatted} ${currency}`
}

const NAME_REGEX  = /^[A-Za-z\s'-]+$/
const PHONE_REGEX = /^(0\d{9}|\+94\d{9})$/

const inquiryValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Name is required.')
    .matches(NAME_REGEX, 'Name can only contain letters, spaces, apostrophes and hyphens.')
    .min(2, 'Name must be at least 2 characters.'),
  email: Yup.string()
    .trim()
    .required('Email is required.')
    .email('Please enter a valid email address.'),
  phone: Yup.string()
    .trim()
    .test(
      'valid-phone',
      'Please enter a valid phone number (e.g. 07X XXX XXXX or +94 7X XXX XXXX).',
      (value) => !value || PHONE_REGEX.test(value)
    ),
  message: Yup.string()
    .trim()
    .required('Message is required.'),
})

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const backUrl = location.state?.from || '/properties'
  const backLabel = backUrl.includes('/dashboard') ? 'Back to my properties' : 'Back to listings'

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [submitted, setSubmitted] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const { isAuthenticated, user }  = useAuth()

  const isOwner = isAuthenticated && user?.id === property?.owner?.id

  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loadingInquiries, setLoadingInquiries] = useState(false)

  const formik = useFormik({
    initialValues: { name: '', email: '', phone: '', message: '' },
    validationSchema: inquiryValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!property) return
      setSendError(null)

      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            from_name:         values.name.trim(),
            from_email:        values.email.trim(),
            phone:             values.phone.trim() || 'Not provided',
            message:           values.message.trim(),
            property_title:    property.title,
            property_price:    `${property.price.toLocaleString()} ${property.currency}`,
            property_location: property.location,
          },
          EMAILJS_PUBLIC_KEY
        )

        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_CONFIRM_TEMPLATE_ID,
          {
            to_name:           values.name.trim(),
            to_email:          values.email.trim(),
            property_title:    property.title,
            property_price:    `${property.price.toLocaleString()} ${property.currency}`,
            property_location: property.location,
          },
          EMAILJS_PUBLIC_KEY
        )

        const rawPropertyId = typeof property.id === 'string' && property.id.startsWith('prop-')
          ? parseInt(property.id.split('-')[1], 10)
          : Number(property.id)

        const payload = {
          name:    values.name.trim(),
          email:   values.email.trim(),
          phone:   values.phone.trim() || undefined,
          message: values.message.trim(),
          propertyId: rawPropertyId,
          source: 'property_page'
        }

        const res = await fetch(`${BASE_URL}/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to save inquiry to database')

        setSubmitted(true)
      } catch (err) {
        console.error('EmailJS error:', err)
        setSendError('Failed to send inquiry. Please try again.')
      } finally {
        setSubmitting(false)
      }
    },
  })

  useEffect(() => {
    async function fetchProperty() {
      if (!id) return
      try {
        setLoading(true)
        setFetchError(null)
        try {
          const data = await propertyApi.getProperty(id)
          // PropertyApi returns PropertyPayload & { id, images }
          setProperty(data as unknown as Property)
        } catch (err: any) {
          if (err.message?.includes('not found') || err.message?.includes('404')) {
            setFetchError('Property not found')
            return
          }
          throw err
        }
      } catch (err: unknown) {
        console.error(err)
        setFetchError(err instanceof Error ? err.message : 'Failed to connect to server')
      } finally {
        setLoading(false)
      }
    }
    fetchProperty()
  }, [id])

  useEffect(() => {
    if (!isOwner || !property) return
    const p: Property = property
    async function loadInquiries() {
      setLoadingInquiries(true)
      try {
        const rawPropertyId = typeof p.id === 'string' && p.id.startsWith('prop-')
          ? parseInt(p.id.split('-')[1], 10)
          : Number(p.id)
        const data = await getOwnerInquiries(rawPropertyId)
        setInquiries(data)
      } catch (err) {
        console.error("Failed to load inquiries", err)
      } finally {
        setLoadingInquiries(false)
      }
    }
    loadInquiries()
  }, [isOwner, property])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors">
        <Navbar />
        <div className="grid flex-1 place-items-center">
          <div className="text-center flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={36} />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading property details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (fetchError || !property) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors">
        <Navbar />
        <div className="grid flex-1 place-items-center">
          <div className="text-center">
            <p className="text-lg font-semibold">{fetchError ?? 'Property not found'}</p>
            <Link to="/properties" className="mt-3 inline-block text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              Back to listings
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Block invalid characters as the user types, on top of Formik/Yup validation
  // on blur & submit. This stops digits from ever landing in the Name field,
  // and stops letters/extra digits from landing in the Phone field.
  function handleNameChange(raw: string) {
    const sanitized = raw.replace(/[^A-Za-z\s'-]/g, '')
    formik.setFieldValue('name', sanitized)
  }

  function handlePhoneChange(raw: string) {
    const hasPlus = raw.trim().startsWith('+')
    const digits = raw.replace(/\D/g, '').slice(0, 11)
    const sanitized = (hasPlus ? '+' : '') + digits
    formik.setFieldValue('phone', sanitized)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(backUrl)}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft size={16} /> {backLabel}
        </button>

        {/* Image placeholder */}
        {property.images && property.images.length > 0 ? (
          <div className="relative h-56 w-full overflow-hidden rounded-3xl bg-slate-100 sm:h-[420px] shadow-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <img
              src={property.images[0]}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-300 sm:h-[420px] shadow-sm dark:bg-indigo-950/30 dark:border-indigo-900/40 dark:text-indigo-700">
            <MapPin size={48} />
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">

          {/* ── Left: details ──────────────────────────────────── */}
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 mb-4 border border-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
              <MapPin size={12} className="text-indigo-500 dark:text-indigo-400" /> {property.location}, Australia
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {formatPrice(property.price, property.currency, property.listingType)}
            </h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300 font-medium">{property.title}</p>

            {/* Specs */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {property.bedrooms        != null && <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm dark:bg-slate-800 dark:border-slate-700"><BedDouble size={18} className="text-indigo-500 dark:text-indigo-400" /> {property.bedrooms} bedrooms</span>}
              {property.bathrooms       != null && <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm dark:bg-slate-800 dark:border-slate-700"><Bath size={18} className="text-indigo-500 dark:text-indigo-400" />      {property.bathrooms} bathrooms</span>}
              {property.areaSqft        != null && <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm dark:bg-slate-800 dark:border-slate-700"><Ruler size={18} className="text-indigo-500 dark:text-indigo-400" />    {property.areaSqft} sqft</span>}
              {property.landSizePerches != null && <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm dark:bg-slate-800 dark:border-slate-700"><Ruler size={18} className="text-indigo-500 dark:text-indigo-400" />    {property.landSizePerches} perches</span>}
            </div>

            <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Description</h3>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">{property.description || 'No description provided.'}</p>

              <hr className="my-8 border-slate-100 dark:border-slate-800" />

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Property details</h3>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/30">
                <Row label="Property type" value={property.type} />
                <Row label="Listing type"  value={`For ${property.listingType}`} />
                {property.furnishing && <Row label="Furnishing" value={property.furnishing} />}
                {property.parking    && <Row label="Parking"    value={property.parking} />}
                <Row label="Listed by" value={property.listedBy} />
              </div>
            </div>
          </div>

          {/* ── Right: owner + contact form ──────────────────── */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-6">

            {/* Owner contact card */}
            {property.owner && (
              <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-md shadow-indigo-100/50 dark:border-indigo-900/40 dark:bg-slate-900 dark:shadow-none">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Listed by</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <User size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-base font-bold text-slate-900 dark:text-white">{property.owner.full_name}</p>
                      {property.verified && (
                        <span title="Verified listing" className="shrink-0 flex items-center">
                          <ShieldCheck size={16} className="text-emerald-500" />
                        </span>
                      )}
                    </div>
                    <a
                      href={`mailto:${property.owner.email}`}
                      className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition truncate"
                    >
                      <Mail size={14} />
                      {property.owner.email}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Inquiry / contact form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              {isOwner ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-2 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <ShieldCheck size={32} />
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">This is your listing</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 px-4">
                    You are viewing this property as the owner. Switch to edit mode to make changes.
                  </p>
                  <button
                    onClick={() => navigate(`/dashboard/properties/add?id=${property.id}`)}
                    className="mt-4 w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 dark:shadow-none transition hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Edit property
                  </button>

                  {/* Embedded Inquiries for Owner */}
                  <div className="mt-8 w-full border-t border-slate-100 dark:border-slate-800 pt-6 text-left">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">Inquiries</h3>
                    {loadingInquiries ? (
                      <div className="flex justify-center py-4">
                        <Loader2 size={20} className="animate-spin text-indigo-500 dark:text-indigo-400" />
                      </div>
                    ) : inquiries.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">No inquiries yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {inquiries.map(inq => (
                          <div key={inq.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm text-sm dark:border-slate-700 dark:bg-slate-800/50">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-slate-900 dark:text-white">{inq.name}</span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {format(new Date(inq.createdAt.endsWith('Z') ? inq.createdAt : inq.createdAt + 'Z'), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5 text-slate-600 mb-3 text-xs font-medium dark:text-slate-300">
                              <a href={`mailto:${inq.email}`} className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition"><Mail size={12}/> {inq.email}</a>
                              {inq.phone && (
                                <a href={`tel:${inq.phone}`} className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition"><Phone size={12}/> {inq.phone}</a>
                              )}
                            </div>
                            {inq.message && (
                              <p className="text-slate-600 mt-2 bg-white p-3 rounded-lg border border-slate-100 italic text-xs leading-relaxed dark:text-slate-300 dark:bg-slate-900 dark:border-slate-700">
                                "{inq.message}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : submitted ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-2 dark:bg-emerald-950/30 dark:text-emerald-400">
                    <CheckCircle2 size={32} />
                  </div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Inquiry sent!</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Thanks {formik.values.name.split(' ')[0]}! The listing agent will get back to you shortly.
                  </p>
                  <p className="text-sm font-medium text-indigo-600 mt-2 bg-indigo-50 px-4 py-2 rounded-lg dark:text-indigo-400 dark:bg-indigo-950/30">
                    A confirmation email has been sent to {formik.values.email}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Interested in this property?</p>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Send a message and the listing agent will get back to you.
                  </p>

                  <form onSubmit={formik.handleSubmit} noValidate className="mt-6 space-y-4">
                    <Field
                      label="Name"
                      placeholder="Your name"
                      value={formik.values.name}
                      onChange={handleNameChange}
                      onBlur={formik.handleBlur}
                      name="name"
                      error={formik.touched.name ? formik.errors.name : undefined}
                    />
                    <Field
                      label="Email"
                      placeholder="you@email.com"
                      value={formik.values.email}
                      onChange={v => formik.setFieldValue('email', v)}
                      onBlur={formik.handleBlur}
                      name="email"
                      type="email"
                      error={formik.touched.email ? formik.errors.email : undefined}
                    />
                    <Field
                      label="Phone"
                      placeholder="+94 7X XXX XXXX"
                      value={formik.values.phone}
                      onChange={handlePhoneChange}
                      onBlur={formik.handleBlur}
                      name="phone"
                      error={formik.touched.phone ? formik.errors.phone : undefined}
                    />
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Message</label>
                      <textarea
                        name="message"
                        value={formik.values.message}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="I'm interested in this property and would like to schedule a viewing."
                        rows={4}
                        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                      />
                      {formik.touched.message && formik.errors.message && (
                        <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{formik.errors.message}</p>
                      )}
                    </div>

                    {sendError && (
                      <p className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900/40">{sendError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={formik.isSubmitting}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {formik.isSubmitting && <Loader2 size={16} className="animate-spin" />}
                      {formik.isSubmitting ? 'Sending inquiry…' : 'Send inquiry'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 text-sm">
      <span className="font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-bold text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}

function Field({
  label, value, onChange, onBlur, placeholder, name, type = 'text', error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  placeholder: string
  name: string
  type?: string
  error?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition shadow-sm dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-red-500'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700'
        }`}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}