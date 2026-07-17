import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { getOwnerInquiries, Inquiry } from '@/api/inquiryApi'
import { Loader2, Inbox, Calendar, User, Mail, Phone, Home } from 'lucide-react'
import { format } from 'date-fns'

export default function InquiriesList() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInquiries() {
      try {
        setLoading(true)
        const data = await getOwnerInquiries()
        setInquiries(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load inquiries')
      } finally {
        setLoading(false)
      }
    }
    fetchInquiries()
  }, [])

  return (
    <DashboardLayout activeNav="Requests">
      <div className="flex flex-1 flex-col bg-slate-950 min-h-full">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-800 px-6">
          <h1 className="text-lg font-semibold text-slate-100">My Requests</h1>
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
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-slate-700">
                <Inbox size={32} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">No requests yet</h3>
              <p className="mt-1 text-sm text-slate-500">When someone inquires about your properties, they'll appear here.</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-5xl mx-auto">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm transition hover:border-slate-700">
                  <div className="flex flex-col lg:flex-row gap-6 justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-semibold">
                          {inquiry.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                            <User size={16} className="text-slate-500" />
                            {inquiry.name}
                          </h3>
                          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <Calendar size={14} className="text-slate-500" />
                            {format(new Date(inquiry.createdAt.endsWith('Z') ? inquiry.createdAt : inquiry.createdAt + 'Z'), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail size={16} className="text-slate-500" />
                          <a href={`mailto:${inquiry.email}`} className="hover:text-indigo-400 transition">{inquiry.email}</a>
                        </div>
                        {inquiry.phone && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Phone size={16} className="text-slate-500" />
                            <a href={`tel:${inquiry.phone}`} className="hover:text-indigo-400 transition">{inquiry.phone}</a>
                          </div>
                        )}
                        {inquiry.propertyTitle && (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Home size={16} className="text-slate-500" />
                            <span className="truncate max-w-[200px] block" title={inquiry.propertyTitle}>{inquiry.propertyTitle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {inquiry.message && (
                      <div className="lg:w-1/2 rounded-xl bg-slate-950/50 p-4 border border-slate-800/50 text-sm text-slate-300 whitespace-pre-wrap">
                        {inquiry.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
