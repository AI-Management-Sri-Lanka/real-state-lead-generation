// src/pages/admin/AdminUsersPage.tsx
import { useState, useEffect, useMemo } from 'react'
import {
  Search, Loader2, UserCheck, UserX, Trash2, RefreshCw,
  AlertCircle, Users, CheckCircle2, Key, ChevronLeft, ChevronRight
} from 'lucide-react'
import { adminUsersApi, AdminUser } from '@/api/adminApi'

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
      <CheckCircle2 size={11} /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400">
      <UserX size={11} /> Banned
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-indigo-600', 'bg-purple-600', 'bg-blue-600', 'bg-cyan-600', 'bg-emerald-600']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`flex-shrink-0 h-9 w-9 rounded-xl ${color} flex items-center justify-center text-xs font-bold text-white`}>
      {initials}
    </div>
  )
}

const PAGE_SIZE = 10

function getPageNumbers(current: number, total: number): (number | '…')[] {
  const delta = 1
  const range: (number | '…')[] = []
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  range.push(1)
  if (left > 2) range.push('…')
  for (let i = left; i <= right; i++) range.push(i)
  if (right < total - 1) range.push('…')
  if (total > 1) range.push(total)

  return range
}

function Pagination({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Users pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-300 transition hover:border-indigo-500 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:text-slate-300"
      >
        <ChevronLeft size={14} /> Previous
      </button>

      {getPageNumbers(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-xs text-slate-500 select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition ${
              p === page
                ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.4)]'
                : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-indigo-500 hover:text-indigo-300'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="inline-flex h-9 items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-300 transition hover:border-indigo-500 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:text-slate-300"
      >
        Next <ChevronRight size={14} />
      </button>
    </nav>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const load = async () => {
    try {
      setLoading(true); setError(null)
      const { users: data, total: t } = await adminUsersApi.getUsers({ limit: 500 })
      setUsers(data); setTotal(t)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return users
    return users.filter(u =>
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }, [users, search])

  useEffect(() => {
    setPage(1)
  }, [search, users])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  const handleToggle = async (user: AdminUser) => {
    setActionId(user.id)
    try {
      await adminUsersApi.toggleUserStatus(user.id, !user.is_active)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Permanently delete "${user.full_name}" and all their data?\nThis CANNOT be undone.`)) return
    setActionId(user.id)
    try {
      await adminUsersApi.deleteUser(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionId(null)
    }
  }

  const handleResetPassword = async (user: AdminUser) => {
    const newPassword = window.prompt(`Enter a new password for "${user.full_name}":\n(Must be at least 8 chars, uppercase, lowercase, number, special char)`)
    if (!newPassword) return
    
    const confirmPassword = window.prompt(`Confirm the new password for "${user.full_name}":`)
    if (!confirmPassword) return

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!")
      return
    }
    
    setActionId(user.id)
    try {
      await adminUsersApi.resetUserPassword(user.id, newPassword, confirmPassword)
      alert(`Password for ${user.full_name} has been reset successfully.`)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Reset password failed')
    } finally {
      setActionId(null)
    }
  }

  const activeCount = users.filter(u => u.is_active).length
  const bannedCount = users.length - activeCount

  return (
    <div className="flex flex-1 flex-col max-w-7xl mx-auto w-full">

      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-slate-500">Manage platform users and property owners</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Users', value: total, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
            { label: 'Active Users', value: activeCount, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Banned Users', value: bannedCount, icon: UserX, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-extrabold text-white mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-xl border ${bg}`}>
                <Icon size={22} className={color} />
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-slate-700/80 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-900/50 bg-red-950/20 p-5 text-sm text-red-400">
            <AlertCircle size={20} className="shrink-0" /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-600">
            {search ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          <>
          {/* Mobile card list (no horizontal scrolling) */}
          <div className="space-y-3 md:hidden">
            {paginated.map(user => (
              <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={user.full_name} />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{user.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <StatusBadge isActive={user.is_active} />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
                  <p className="text-[11px] text-slate-500">
                    Joined {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(user)}
                      disabled={actionId === user.id}
                      title={user.is_active ? 'Ban user' : 'Activate user'}
                      className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                        user.is_active
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {actionId === user.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : user.is_active ? (
                        <UserX size={12} />
                      ) : (
                        <UserCheck size={12} />
                      )}
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      disabled={actionId === user.id}
                      title="Force reset password"
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-300 disabled:opacity-40"
                    >
                      {actionId === user.id ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={actionId === user.id}
                      title="Delete user permanently"
                      className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-400 disabled:opacity-40"
                    >
                      {actionId === user.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-md md:block">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-left text-xs font-bold uppercase tracking-wider text-slate-300">
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginated.map(user => (
                  <tr key={user.id} className="group hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.full_name} />
                        <div>
                          <p className="font-semibold text-white">{user.full_name}</p>
                          <p className="text-xs text-slate-400 font-mono">ID #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300 font-medium">{user.email}</td>
                    <td className="px-5 py-4"><StatusBadge isActive={user.is_active} /></td>
                    <td className="px-5 py-4 hidden md:table-cell text-xs text-slate-300">
                      {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(user)}
                          disabled={actionId === user.id}
                          title={user.is_active ? 'Ban user' : 'Activate user'}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                            user.is_active
                              ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                          }`}
                        >
                          {actionId === user.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : user.is_active ? (
                            <><UserX size={12} /> Ban</>
                          ) : (
                            <><UserCheck size={12} /> Unban</>
                          )}
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          disabled={actionId === user.id}
                          title="Force reset password"
                          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                        >
                          {actionId === user.id ? <Loader2 size={12} className="animate-spin" /> : <><Key size={12} /> Reset Password</>}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={actionId === user.id}
                          title="Delete user permanently"
                          className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/15 hover:text-rose-300 transition-colors disabled:opacity-40"
                        >
                          {actionId === user.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          </>
        )}
      </div>

      {/* ── Footer / pagination — pinned to the bottom of the viewport ──────── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-auto pt-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs text-slate-400 font-semibold">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
            </p>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}