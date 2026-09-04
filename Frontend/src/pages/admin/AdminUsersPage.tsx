// src/pages/admin/AdminUsersPage.tsx
import { useState, useEffect, useMemo } from 'react'
import {
  Search, Loader2, UserCheck, UserX, Trash2, RefreshCw,
  AlertCircle, Users, CheckCircle2, Key, ChevronLeft, ChevronRight, X,
  Eye, EyeOff, ShieldCheck
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
const PASSWORD_RULE_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

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

/**
 * App-themed confirmation modal used in place of window.confirm().
 * Generic enough to reuse for any destructive/confirm action later.
 */
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={loading ? undefined : onCancel}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              destructive
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
            }`}>
              <AlertCircle size={18} />
            </div>
            <h2 id="confirm-dialog-title" className="pt-1.5 text-base font-bold text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-400">
          {description}
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60 ${
              destructive
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * App-themed replacement for the window.prompt()/window.alert() pair
 * previously used to force-reset a user's password. Handles both
 * password entry (with live validation) and the success confirmation,
 * so no native browser dialogs are shown at any point in the flow.
 */
function ResetPasswordDialog({
  open,
  userName,
  loading,
  onSubmit,
  onClose,
}: {
  open: boolean
  userName: string
  loading: boolean
  onSubmit: (password: string, confirmPassword: string) => Promise<boolean>
  onClose: () => void
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset all local state whenever the dialog is opened for a (new) user
  useEffect(() => {
    if (open) {
      setPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setTouched(false)
      setFormError(null)
      setSuccess(false)
    }
  }, [open, userName])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, loading, onClose])

  if (!open) return null

  const meetsRules = PASSWORD_RULE_REGEX.test(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword

  const handleSubmit = async () => {
    setTouched(true)
    setFormError(null)

    if (!meetsRules) {
      setFormError('Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.')
      return
    }
    if (!passwordsMatch) {
      setFormError('Passwords do not match.')
      return
    }

    const ok = await onSubmit(password, confirmPassword)
    if (ok) {
      setSuccess(true)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              success
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}>
              {success ? <ShieldCheck size={18} /> : <Key size={18} />}
            </div>
            <h2 id="reset-password-dialog-title" className="pt-1.5 text-base font-bold text-white">
              {success ? 'Password reset' : 'Reset password'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 disabled:opacity-40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {success ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              The password for <span className="font-semibold text-slate-200">{userName}</span> has been reset successfully.
            </p>
            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={onClose}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Set a new password for <span className="font-semibold text-slate-200">{userName}</span>.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    autoFocus
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950 py-2.5 pl-3.5 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {touched && password.length > 0 && !meetsRules && (
                  <p className="mt-1.5 text-[11px] text-rose-400">
                    Min 8 chars, with uppercase, lowercase, a number, and a special character.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-400">Confirm password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Re-enter new password"
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-950 py-2.5 px-3.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                {touched && confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-1.5 text-[11px] text-rose-400">Passwords do not match.</p>
                )}
              </div>

              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-900/50 bg-rose-950/20 p-2.5 text-xs text-rose-400">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> {formError}
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-60"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                Reset Password
              </button>
            </div>
          </>
        )}
      </div>
    </div>
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
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)

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

  // Opens the custom confirm dialog instead of window.confirm
  const handleDelete = (user: AdminUser) => {
    setDeleteTarget(user)
  }

  // Runs the actual deletion once the user confirms in the dialog
  const confirmDelete = async () => {
    if (!deleteTarget) return
    const user = deleteTarget
    setActionId(user.id)
    try {
      await adminUsersApi.deleteUser(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setDeleteTarget(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionId(null)
    }
  }

  // Opens the custom reset-password dialog instead of window.prompt
  const handleResetPassword = (user: AdminUser) => {
    setResetTarget(user)
  }

  // Runs the actual reset once the user submits the dialog form.
  // Returns true on success so the dialog can switch to its success state,
  // and false on failure so the dialog stays open and shows the error.
  const submitResetPassword = async (password: string, confirmPassword: string): Promise<boolean> => {
    if (!resetTarget) return false
    const user = resetTarget
    setActionId(user.id)
    try {
      await adminUsersApi.resetUserPassword(user.id, password, confirmPassword)
      return true
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Reset password failed')
      return false
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

      {/* Custom-styled delete confirmation, replacing window.confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete user"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.full_name}" and all their data?\nThis cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={deleteTarget !== null && actionId === deleteTarget.id}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Custom-styled reset-password flow, replacing window.prompt/alert */}
      <ResetPasswordDialog
        open={resetTarget !== null}
        userName={resetTarget?.full_name ?? ''}
        loading={resetTarget !== null && actionId === resetTarget.id}
        onSubmit={submitResetPassword}
        onClose={() => setResetTarget(null)}
      />
    </div>
  )
}