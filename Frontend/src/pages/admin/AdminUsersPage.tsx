// src/pages/admin/AdminUsersPage.tsx
import { useState, useEffect, useMemo } from 'react'
import {
  Search, Loader2, UserCheck, UserX, Trash2, RefreshCw,
  AlertCircle, Users, CheckCircle2,
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState<number | null>(null)

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

  const activeCount = users.filter(u => u.is_active).length
  const bannedCount = users.length - activeCount

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Manage platform users and property owners</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: total, icon: Users, color: 'text-indigo-400' },
          { label: 'Active', value: activeCount, icon: UserCheck, color: 'text-emerald-400' },
          { label: 'Banned', value: bannedCount, icon: UserX, color: 'text-red-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-white/5 bg-[#13152a] px-5 py-4 flex items-center gap-4">
            <Icon size={20} className={color} />
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-2xl font-extrabold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-white/10 bg-[#13152a] py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-colors"
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
        <div className="overflow-hidden rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-[#13152a] text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 hidden md:table-cell">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(user => (
                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.full_name} />
                      <div>
                        <p className="font-medium text-white">{user.full_name}</p>
                        <p className="text-xs text-slate-600">ID #{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{user.email}</td>
                  <td className="px-5 py-4"><StatusBadge isActive={user.is_active} /></td>
                  <td className="px-5 py-4 hidden md:table-cell text-xs text-slate-600">
                    {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(user)}
                        disabled={actionId === user.id}
                        title={user.is_active ? 'Ban user' : 'Activate user'}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                          user.is_active
                            ? 'border-red-800/60 text-red-400 hover:bg-red-950/30'
                            : 'border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/30'
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
                        onClick={() => handleDelete(user)}
                        disabled={actionId === user.id}
                        title="Delete user permanently"
                        className="rounded-lg border border-white/10 p-1.5 text-slate-500 hover:border-red-800/60 hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        {actionId === user.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-white/5 bg-[#13152a] px-5 py-3 text-xs text-slate-600 text-right">
            Showing {filtered.length} of {total} users
          </div>
        </div>
      )}
    </div>
  )
}
