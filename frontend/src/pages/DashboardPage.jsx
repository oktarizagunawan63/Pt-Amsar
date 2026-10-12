import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle, AlertTriangle, CheckCircle, Clock, FolderKanban, Plus,
  RefreshCw, UserCheck, Users, Wallet, Activity, TrendingUp,
} from '@icons'
import useAppStore from '../store/appStore'
import useAuthStore from '../store/authStore'
import useUserStore from '../store/userStore'
import { can, filterProjectsByRole } from '../lib/permissions'
import { api } from '../lib/api'
import {
  PageHeader, SectionCard, CardLink, StatTile, Meter, StatusBadge, EmptyState, SkeletonBlock,
  formatRupiahCompact, formatDate, daysUntil, relativeDeadline, relativeTime,
} from '../components/dashboard/DashboardUI'

const STATUS_RANK = { delayed: 0, at_risk: 1, on_track: 2 }
const TABLE_LIMIT = 8

const todayLabel = () => new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { users } = useUserStore()
  const projects = useAppStore(state => state.projects)
  const projectsLoading = useAppStore(state => state.projectsLoading)
  const fetchProjects = useAppStore(state => state.fetchProjects)

  const isAdmin = user?.role === 'administrator' || user?.role === 'direktur'
  const [filterSM, setFilterSM] = useState('all')
  const [stats, setStats] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [loadError, setLoadError] = useState(false)

  const loadDashboard = useCallback(async () => {
    if (!user) return
    setLoadError(false)
    // Projects drive most of this page; the dashboard used to never load them,
    // so landing here right after login showed "no projects".
    fetchProjects()

    try {
      if (isAdmin) {
        const [dash, att] = await Promise.allSettled([api.getAdminDashboard(), api.getAttendanceSummary()])
        if (dash.status === 'fulfilled' && dash.value?.success) setStats(dash.value.data || {})
        else setLoadError(true)
        if (att.status === 'fulfilled' && att.value?.success) setAttendance(att.value.data)
      } else if (user.role === 'site_manager') {
        const dash = await api.getSiteManagerDashboard()
        setStats(dash?.data || {})
      }
    } catch (error) {
      console.warn('Dashboard load failed:', error.message)
      setLoadError(true)
    }
  }, [user, isAdmin, fetchProjects])

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 60000)
    return () => clearInterval(interval)
  }, [loadDashboard])

  const siteManagers = useMemo(() => users.filter(u => u.role === 'site_manager'), [users])

  const visibleProjects = useMemo(() => {
    const scoped = filterProjectsByRole(projects, user, users)
    if (!isAdmin || filterSM === 'all') return scoped
    const sm = siteManagers.find(s => String(s.id) === String(filterSM))
    return scoped.filter(p =>
      String(p.projectManagerId ?? '') === String(filterSM) ||
      (sm && p.pm?.toLowerCase() === sm.name?.toLowerCase())
    )
  }, [projects, user, users, isAdmin, filterSM, siteManagers])

  const metrics = useMemo(() => {
    const active = visibleProjects
      .filter(p => p.status !== 'completed')
      .map(p => ({ ...p, daysLeft: daysUntil(p.deadline) }))
      .sort((a, b) =>
        (STATUS_RANK[a.status] ?? 3) - (STATUS_RANK[b.status] ?? 3) ||
        (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)
      )

    const totalRab = active.reduce((sum, p) => sum + (Number(p.rab) || 0), 0)
    const totalReal = active.reduce((sum, p) => sum + (Number(p.realisasi) || 0), 0)
    const delayed = active.filter(p => p.status === 'delayed' || (p.daysLeft !== null && p.daysLeft < 0))
    const overBudget = active.filter(p => Number(p.rab) > 0 && Number(p.realisasi) > Number(p.rab))
    const dueSoon = active.filter(p => p.daysLeft !== null && p.daysLeft >= 0 && p.daysLeft <= 14 && (p.progress || 0) < 80)
    const avgProgress = active.length ? Math.round(active.reduce((s, p) => s + (p.progress || 0), 0) / active.length) : 0

    return {
      active,
      completed: visibleProjects.filter(p => p.status === 'completed').length,
      totalRab,
      totalReal,
      rabPct: totalRab ? Math.round((totalReal / totalRab) * 100) : 0,
      delayed,
      overBudget,
      dueSoon,
      avgProgress,
    }
  }, [visibleProjects])

  // Things someone should act on today, most severe first.
  const attentionItems = useMemo(() => {
    const items = []
    metrics.delayed.forEach(p => items.push({
      key: `delay-${p.id}`, tone: 'critical', icon: AlertCircle, to: `/projects/${p.id}`,
      title: p.name, detail: `Melewati deadline${p.daysLeft < 0 ? ` ${Math.abs(p.daysLeft)} hari` : ''} · progress ${p.progress || 0}%`,
    }))
    metrics.overBudget.forEach(p => items.push({
      key: `budget-${p.id}`, tone: 'critical', icon: Wallet, to: `/projects/${p.id}`,
      title: p.name, detail: `Over budget ${formatRupiahCompact(p.realisasi - p.rab)}`,
    }))
    metrics.dueSoon.forEach(p => items.push({
      key: `due-${p.id}`, tone: 'warning', icon: Clock, to: `/projects/${p.id}`,
      title: p.name, detail: `${relativeDeadline(p.daysLeft)} · progress baru ${p.progress || 0}%`,
    }))
    const pendingUsers = stats?.users?.pending || 0
    if (isAdmin && pendingUsers > 0) {
      items.push({
        key: 'pending-users', tone: 'warning', icon: UserCheck, to: '/users',
        title: `${pendingUsers} user menunggu persetujuan`, detail: 'Tinjau registrasi baru',
      })
    }
    return items
  }, [metrics, stats, isAdmin])

  const criticalCount = attentionItems.filter(i => i.tone === 'critical').length
  const isInitialLoading = projectsLoading && projects.length === 0
  const attendanceStats = attendance?.today_stats
  // Logins drown out the events that matter (project, approval, visit changes).
  const recentActivities = (stats?.recent_activities || []).filter(log => log.action !== 'login')

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${todayLabel()} · Ringkasan operasional proyek`}
        actions={
          <>
            {isAdmin && siteManagers.length > 0 && (
              <select
                value={filterSM}
                onChange={e => setFilterSM(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                aria-label="Filter site manager"
              >
                <option value="all">Semua site manager</option>
                {siteManagers.map(sm => <option key={sm.id} value={sm.id}>{sm.name}</option>)}
              </select>
            )}
            {can(user, 'create_project') && (
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <Plus size={16} />
                Proyek Baru
              </button>
            )}
          </>
        }
      />

      {loadError && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <span className="min-w-0 flex-1">Sebagian data gagal dimuat dari server. Angka di bawah mungkin belum terbaru.</span>
          <button onClick={loadDashboard} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium hover:bg-amber-100">
            <RefreshCw size={12} /> Coba lagi
          </button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          label="Proyek aktif"
          icon={FolderKanban}
          value={metrics.active.length}
          to="/projects"
          tone={metrics.delayed.length ? 'critical' : 'neutral'}
          context={metrics.delayed.length ? `${metrics.delayed.length} terlambat` : `${metrics.completed} proyek selesai`}
        />
        <StatTile
          label="Realisasi anggaran"
          icon={Wallet}
          value={`${metrics.rabPct}%`}
          tone={metrics.rabPct > 100 ? 'critical' : 'neutral'}
          context={`${formatRupiahCompact(metrics.totalReal)} dari ${formatRupiahCompact(metrics.totalRab)}`}
        >
          <div className="mt-3"><Meter value={metrics.totalReal} max={metrics.totalRab || 1} size="sm" label="Realisasi anggaran" /></div>
        </StatTile>
        {isAdmin ? (
          <StatTile
            label="Kehadiran hari ini"
            icon={Users}
            to="/admin/attendance-monitor"
            value={attendanceStats ? `${attendanceStats.checked_in}/${attendanceStats.total_employees}` : '–'}
            context={attendanceStats ? `${attendanceStats.attendance_rate}% hadir · ${attendanceStats.currently_working} masih bekerja` : 'Data absensi belum tersedia'}
          />
        ) : (
          <StatTile
            label="Rata-rata progress"
            icon={TrendingUp}
            value={`${metrics.avgProgress}%`}
            context="Proyek yang sedang berjalan"
          >
            <div className="mt-3"><Meter value={metrics.avgProgress} size="sm" label="Rata-rata progress" /></div>
          </StatTile>
        )}
        <StatTile
          label="Perlu perhatian"
          icon={AlertTriangle}
          value={attentionItems.length}
          tone={attentionItems.some(i => i.tone === 'critical') ? 'critical' : attentionItems.length ? 'warning' : 'good'}
          context={attentionItems.length
            ? [
                criticalCount && `${criticalCount} kritis`,
                attentionItems.length - criticalCount && `${attentionItems.length - criticalCount} dipantau`,
              ].filter(Boolean).join(' · ')
            : 'Semua proyek aman'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Active projects */}
        <SectionCard
          className="xl:col-span-2"
          title="Proyek berjalan"
          description="Diurutkan dari yang paling butuh tindakan"
          action={metrics.active.length > 0 && <CardLink to="/projects">Lihat semua</CardLink>}
          bodyClassName=""
        >
          {isInitialLoading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map(i => <SkeletonBlock key={i} className="h-12 w-full" />)}
            </div>
          ) : metrics.active.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Belum ada proyek berjalan"
              description="Proyek baru dan proyek dari funnel yang WON akan muncul di sini."
              action={can(user, 'create_project') && (
                <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
                  <Plus size={16} /> Buat proyek
                </button>
              )}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="whitespace-nowrap border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                      <th className="px-5 py-2.5 font-medium">Proyek</th>
                      <th className="w-36 px-3 py-2.5 font-medium">Progress</th>
                      <th className="w-40 px-3 py-2.5 font-medium">Anggaran terpakai</th>
                      <th className="w-32 px-3 py-2.5 font-medium">Deadline</th>
                      <th className="w-28 px-5 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {metrics.active.slice(0, TABLE_LIMIT).map(p => {
                      const budgetPct = Number(p.rab) > 0 ? Math.round((Number(p.realisasi) / Number(p.rab)) * 100) : 0
                      const overdue = p.daysLeft !== null && p.daysLeft < 0
                      return (
                        <tr
                          key={p.id}
                          onClick={() => navigate(`/projects/${p.id}`)}
                          className="cursor-pointer transition-colors hover:bg-gray-50"
                        >
                          <td className="min-w-[220px] px-5 py-3">
                            <Link to={`/projects/${p.id}`} onClick={e => e.stopPropagation()} className="line-clamp-2 font-medium text-gray-900 hover:text-brand-700">
                              {p.name}
                            </Link>
                            <p className="truncate text-xs text-gray-500">{[p.location, isAdmin && p.pm].filter(Boolean).join(' · ') || '-'}</p>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <Meter value={p.progress || 0} size="sm" label={`Progress ${p.name}`} />
                              <span className="w-9 shrink-0 text-right text-xs tabular-nums text-gray-700">{p.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <Meter value={Number(p.realisasi) || 0} max={Number(p.rab) || 1} size="sm" label={`Anggaran ${p.name}`} />
                              <span className={`w-10 shrink-0 text-right text-xs tabular-nums ${budgetPct > 100 ? 'font-semibold text-red-600' : 'text-gray-700'}`}>{budgetPct}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-gray-900">{formatDate(p.deadline, { day: 'numeric', month: 'short' })}</p>
                            <p className={`text-xs ${overdue ? 'font-medium text-red-600' : 'text-gray-500'}`}>{relativeDeadline(p.daysLeft)}</p>
                          </td>
                          <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <ul className="divide-y divide-gray-100 md:hidden">
                {metrics.active.slice(0, TABLE_LIMIT).map(p => (
                  <li key={p.id}>
                    <Link to={`/projects/${p.id}`} className="block px-5 py-4 active:bg-gray-50">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate font-medium text-gray-900">{p.name}</p>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <Meter value={p.progress || 0} size="sm" label={`Progress ${p.name}`} />
                        <span className="w-9 shrink-0 text-right text-xs tabular-nums text-gray-700">{p.progress || 0}%</span>
                      </div>
                      <p className={`mt-1.5 text-xs ${p.daysLeft < 0 ? 'font-medium text-red-600' : 'text-gray-500'}`}>
                        Deadline {formatDate(p.deadline, { day: 'numeric', month: 'short' })} · {relativeDeadline(p.daysLeft)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>

              {metrics.active.length > TABLE_LIMIT && (
                <div className="border-t border-gray-100 px-5 py-3 text-center">
                  <CardLink to="/projects">{metrics.active.length - TABLE_LIMIT} proyek lainnya</CardLink>
                </div>
              )}
            </>
          )}
        </SectionCard>

        <div className="space-y-6">
          {/* Attention */}
          <SectionCard title="Perlu perhatian" bodyClassName="">
            {attentionItems.length === 0 ? (
              <div className="flex items-center gap-3 px-5 py-6">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tidak ada yang mendesak</p>
                  <p className="text-xs text-gray-500">Semua proyek sesuai jadwal & anggaran.</p>
                </div>
              </div>
            ) : (
              <ul className="max-h-[340px] divide-y divide-gray-100 overflow-y-auto">
                {attentionItems.map(item => {
                  const Icon = item.icon
                  return (
                    <li key={item.key}>
                      <Link to={item.to} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-gray-50">
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.tone === 'critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          <Icon size={15} aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray-900">{item.title}</span>
                          <span className="block text-xs text-gray-500">{item.detail}</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </SectionCard>

          {/* Recent activity (admin) */}
          {isAdmin && (
            <SectionCard title="Aktivitas terbaru" action={<CardLink to="/activity">Semua</CardLink>} bodyClassName="">
              {recentActivities.length === 0 ? (
                <EmptyState icon={Activity} title="Belum ada aktivitas" />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recentActivities.slice(0, 6).map(log => (
                    <li key={log.id} className="flex gap-3 px-5 py-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{log.user_name}</span>{' '}
                          <span className="text-gray-600">{log.description || log.action}</span>
                        </p>
                        <p className="text-xs text-gray-400">{relativeTime(log.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}
