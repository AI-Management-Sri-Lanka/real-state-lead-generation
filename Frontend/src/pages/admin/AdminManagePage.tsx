// src/pages/admin/AdminManagePage.tsx
import { useState, useEffect } from 'react'
import {
  Shield, Plus, Loader2, AlertCircle, RefreshCw,
  CheckCircle2, XCircle, Eye, EyeOff, X,
} from 'lucide-react'
import { adminMgmtApi, AdminRecord } from '@/api/adminApi'

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
      <CheckCircle2 size={11} /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-2.5 py-1 text-xs font-semibold text-slate-500">
      <XCircle size={11} /> Inactive
    </span>
  )
}

interface InviteForm { full_name: string; email: string; password: string }

export default function AdminManagePage() {
  const [admins, setAdmins] = useState<AdminRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState<InviteForm>({ full_name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const currentAdmin = (() => {
    try { return JSON.parse(localStorage.getItem('aimsl_admin') ?? '{}') }
    catch { return {} }
  })()

  const load = async () => {
    try {
      setLoading(true); setError(null)
      const { admins: data } = await adminMgmtApi.getAdmins()
      setAdmins(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (admin: AdminRecord) => {
    if (admin.email === currentAdmin?.email) {
      alert('You cannot deactivate your own account.')
      return
    }
    setActionId(admin.id)
    try {
      await adminMgmtApi.toggleAdminStatus(admin.id, !admin.is_active)
      setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: !a.is_active } : a))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActionId(null)
    }
  }

  const handleInvite = async () => {
    if (!form.full_name.trim() || !form.email.trim() || form.password.length < 8) {
      setInviteError('Please fill all fields. Password must be at least 8 characters.')
      return
    }
    setInviteLoading(true); setInviteError(null)
    try {
      const newAdmin = await adminMgmtApi.createAdmin(form)
      setAdmins(prev => [...prev, newAdmin])
      setInviteSuccess(true)
      setForm({ full_name: '', email: '', password: '' })
      setTimeout(() => { setShowInvite(false); setInviteSuccess(false) }, 1500)
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to create admin')
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">Manage master administrator access</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            <Plus size={15} /> Invite Admin
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#13152a] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Invite New Admin</h2>
              <button onClick={() => { setShowInvite(false); setInviteError(null); setInviteSuccess(false) }}
                className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                </div>
                <p className="font-semibold text-white">Admin created!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Full Name</label>
                  <input
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f1e] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="admin@example.com"
                    className="w-full rounded-xl border border-white/10 bg-[#0d0f1e] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min. 8 characters"
                      className="w-full rounded-xl border border-white/10 bg-[#0d0f1e] px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {inviteError && (
                  <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-xs text-red-400">{inviteError}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowInvite(false)}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviteLoading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60"
                  >
                    {inviteLoading ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create Admin'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-900/50 bg-red-950/20 p-5 text-sm text-red-400">
          <AlertCircle size={20} className="shrink-0" /> {error}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#13152a] text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {admins.map(admin => {
                const isSelf = admin.email === currentAdmin?.email
                return (
                  <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                          <Shield size={16} className="text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{admin.full_name}</p>
                          {isSelf && <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">You</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{admin.email}</td>
                    <td className="px-5 py-4"><StatusBadge isActive={admin.is_active} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleToggle(admin)}
                          disabled={actionId === admin.id || isSelf}
                          title={isSelf ? 'Cannot deactivate yourself' : admin.is_active ? 'Deactivate' : 'Activate'}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            admin.is_active
                              ? 'border-red-800/60 text-red-400 hover:bg-red-950/30'
                              : 'border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/30'
                          }`}
                        >
                          {actionId === admin.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : admin.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="border-t border-white/5 bg-[#13152a] px-5 py-3 text-xs text-slate-600 text-right">
            {admins.length} admin{admins.length !== 1 ? 's' : ''} total
          </div>
        </div>
      )}
    </div>
  )
}
