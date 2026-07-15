// src/pages/admin/AdminDashboardPage.tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Building2, ShieldCheck, MessageSquare,
  TrendingUp, UserX, ArrowRight, Loader2, RefreshCw, Shield,
} from 'lucide-react'
import { adminDashboardApi, DashboardStats } from '@/api/adminApi'

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({
  icon: Icon, label, value, sub, color, trend,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  color: string
  trend?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#13152a] p-5 group hover:border-white/10 transition-colors">
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${color}`} />
      <div className="relative">
        <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl mb-4 ${color} bg-opacity-20`}>
          <Icon size={20} className="text-white" />
        </div>
        <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
        <p className="mt-1 text-sm font-medium text-slate-400">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-600">{sub}</p>}
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <TrendingUp size={12} />
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Donut Chart (Pure CSS) ────────────────────────────────────────────────────
function DonutChart({ verified, unverified }: { verified: number; unverified: number }) {
  const total = verified + unverified
  if (total === 0) return <p className="text-sm text-slate-600 text-center py-8">No data</p>
  const pct = Math.round((verified / total) * 100)
  const circumference = 2 * Math.PI * 40
  const verifiedDash = (verified / total) * circumference

  return (
    <div className="flex items-center gap-8">
      <div className="relative w-28 h-28 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1e2035" strokeWidth="12" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke="#6366f1" strokeWidth="12"
            strokeDasharray={`${verifiedDash} ${circumference - verifiedDash}`}
            strokeLinecap="round"
          />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke="#ef4444" strokeWidth="12"
            strokeDasharray={`${circumference - verifiedDash} ${verifiedDash}`}
            strokeDashoffset={-verifiedDash}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xl font-extrabold text-white">{pct}%</p>
          <p className="text-[10px] text-slate-500">Verified</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <span className="text-sm text-slate-300">Verified</span>
          <span className="ml-auto text-sm font-bold text-white">{verified}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="text-sm text-slate-300">Unverified</span>
          <span className="ml-auto text-sm font-bold text-white">{unverified}</span>
        </div>
      </div>
    </div>
  )
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
  if (entries.length === 0) return <p className="text-sm text-slate-600 text-center py-8">No data</p>
  const max = Math.max(...entries.map(([, v]) => v), 1)
  const COLORS = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500']

  return (
    <div className="space-y-3">
      {entries.map(([key, val], i) => (
        <div key={key} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 capitalize">{key}</span>
            <span className="font-bold text-white">{val}</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${COLORS[i % COLORS.length]}`}
              style={{ width: `${(val / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminDashboardApi.getStats()
      setStats(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const verifiedPct = stats
    ? stats.total_properties > 0
      ? Math.round((stats.verified_properties / stats.total_properties) * 100)
      : 0
    : 0

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Platform overview and analytics</p>
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

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-900/60 bg-red-950/20 p-5 text-sm text-red-400">
          {error}
        </div>
      )}

      {stats && !loading && (
        <>
          {/* ── Metric Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              icon={Users}
              label="Total Users"
              value={stats.total_users}
              sub={`${stats.active_users} active · ${stats.inactive_users} banned`}
              color="bg-indigo-500"
              trend={`+${stats.new_users_last_7_days} this week`}
            />
            <MetricCard
              icon={Building2}
              label="Properties"
              value={stats.total_properties}
              sub={`${stats.verified_properties} verified`}
              color="bg-purple-500"
            />
            <MetricCard
              icon={ShieldCheck}
              label="Verified Rate"
              value={`${verifiedPct}%`}
              sub={`${stats.unverified_properties} pending review`}
              color="bg-emerald-500"
            />
            <MetricCard
              icon={MessageSquare}
              label="AI Sessions"
              value={stats.total_chat_sessions}
              sub="Total chat sessions"
              color="bg-cyan-500"
            />
          </div>

          {/* ── Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-[#13152a] p-6">
              <h2 className="text-base font-bold text-white mb-6">Verification Status</h2>
              <DonutChart
                verified={stats.verified_properties}
                unverified={stats.unverified_properties}
              />
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#13152a] p-6">
              <h2 className="text-base font-bold text-white mb-6">Properties by Type</h2>
              <BarChart data={stats.properties_by_type} />
            </div>
          </div>

          {/* ── Quick Actions */}
          <div>
            <h2 className="text-base font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Manage Users', to: '/admin/users', icon: Users, color: 'from-indigo-600 to-indigo-700' },
                { label: 'Properties', to: '/admin/properties', icon: Building2, color: 'from-purple-600 to-purple-700' },
                { label: 'Chat Sessions', to: '/admin/sessions', icon: MessageSquare, color: 'from-cyan-600 to-cyan-700' },
                { label: 'Admin Accounts', to: '/admin/manage', icon: Shield, color: 'from-emerald-600 to-emerald-700' },
              ].map(({ label, to, icon: Icon, color }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center justify-between rounded-2xl bg-gradient-to-br ${color} p-4 text-white hover:opacity-90 transition-opacity group`}
                >
                  <div>
                    <Icon size={20} className="mb-2 opacity-80" />
                    <p className="text-sm font-semibold">{label}</p>
                  </div>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
