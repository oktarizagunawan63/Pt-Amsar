import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Calendar, CheckCircle, XCircle, AlertTriangle, MapPin, Plus, ClipboardCheck, TrendingUp } from '@icons'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import {
  PageHeader, SectionCard, CardLink, StatTile, Meter, EmptyState, SkeletonBlock,
  formatDate, daysUntil, relativeDeadline, relativeTime,
} from '../components/dashboard/DashboardUI'

const VISIT_OUTCOME_LABELS = {
  closed: 'Closed / Deal',
  follow_up: 'Follow-up',
  not_interested: 'Tidak tertarik',
  rescheduled: 'Dijadwal ulang',
}

const uniqueById = (list) => Array.from(new Map((list || []).map(item => [item.id, item])).values())

const todayLabel = () => new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function RejectDialog({ visit, onCancel, onSubmit, submitting }) {
  const [reason, setReason] = useState('')
  const valid = reason.trim().length >= 10

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !submitting) onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel, submitting])

  // Portal: the page wrapper is animated (transform), which would trap position:fixed.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 px-4" role="dialog" aria-modal="true" aria-labelledby="reject-title">
      <form
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
        onSubmit={(e) => { e.preventDefault(); if (valid) onSubmit(reason.trim()) }}
      >
        <h2 id="reject-title" className="text-base font-semibold text-gray-900">Tolak kunjungan</h2>
        <p className="mt-1 text-sm text-gray-500">
          {visit.customer_name} · {visit.visitor?.name || 'Sales'}. Alasan akan dikirim ke sales yang bersangkutan.
        </p>
        <label htmlFor="reject-reason" className="mt-4 block text-sm font-medium text-gray-700">Alasan penolakan</label>
        <textarea
          id="reject-reason"
          autoFocus
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          placeholder="Contoh: foto kunjungan tidak sesuai lokasi customer"
        />
        <p className={`mt-1 text-xs ${valid || !reason ? 'text-gray-500' : 'text-red-600'}`}>Minimal 10 karakter ({reason.trim().length}/10)</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={submitting} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            Batal
          </button>
          <button type="submit" disabled={!valid || submitting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Menolak…' : 'Tolak kunjungan'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}

export default function SalesManagerDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentCustomers, setRecentCustomers] = useState([])
  const [teamPerformance, setTeamPerformance] = useState([])
  const [upcomingVisits, setUpcomingVisits] = useState([])
  const [warnings, setWarnings] = useState([])
  const [pendingVisits, setPendingVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState(new Set())
  const [rejecting, setRejecting] = useState(null)
  const isLoadingRef = useRef(false)

  const loadDashboardData = useCallback(async ({ silent = false } = {}) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    if (!silent) setLoading(true)

    const [dash, warn, pending] = await Promise.allSettled([
      api.getSalesManagerDashboard(),
      api.getWarnings({ limit: 5 }),
      api.getPendingUnplannedVisits(),
    ])

    if (dash.status === 'fulfilled') {
      const data = dash.value?.data || {}
      setStats({
        customers: data.customers?.total || 0,
        planVisits: data.visits?.total || 0,
        completedVisits: data.visits?.completed || 0,
        completionRate: data.visits?.completion_rate || 0,
        visitsThisMonth: data.visits?.this_month || 0,
        salesCount: data.team?.sales_count || 0,
        activeWarnings: data.warnings?.active_count || 0,
      })
      setTeamPerformance(
        [...(data.team?.performance || [])].sort((a, b) => b.completion_rate - a.completion_rate || b.visits - a.visits)
      )
      setRecentCustomers(uniqueById(data.recent_customers))
      setUpcomingVisits(uniqueById(data.upcoming_visits))
    } else {
      console.warn('Sales manager dashboard API failed:', dash.reason?.message)
      setStats(null)
    }
    setWarnings(warn.status === 'fulfilled' ? uniqueById(warn.value?.data?.data || warn.value?.data || []) : [])
    setPendingVisits(pending.status === 'fulfilled' ? uniqueById(pending.value?.data || []) : [])

    isLoadingRef.current = false
    setLoading(false)
  }, [])

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(() => loadDashboardData({ silent: true }), 60000)
    return () => clearInterval(interval)
  }, [loadDashboardData])

  const withProcessing = async (visitId, action) => {
    setProcessingIds(prev => new Set(prev).add(visitId))
    try {
      await action()
      await loadDashboardData({ silent: true })
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(visitId)
        return next
      })
    }
  }

  const handleApprove = (visit) => withProcessing(visit.id, async () => {
    try {
      await api.approveUnplannedVisit(visit.id)
      toast.success(`Kunjungan ke ${visit.customer_name} disetujui`)
    } catch (error) {
      toast.error(error.message || 'Gagal menyetujui kunjungan')
    }
  })

  const handleReject = (reason) => {
    const visit = rejecting
    return withProcessing(visit.id, async () => {
      try {
        await api.rejectUnplannedVisit(visit.id, reason)
        toast.success('Kunjungan ditolak')
        setRejecting(null)
      } catch (error) {
        toast.error(error.message || 'Gagal menolak kunjungan')
      }
    })
  }

  const actionCount = pendingVisits.length + (stats?.activeWarnings || warnings.length)

  const sortedUpcoming = useMemo(
    () => [...upcomingVisits].sort((a, b) => String(a.tanggal_visit).localeCompare(String(b.tanggal_visit))),
    [upcomingVisits]
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${todayLabel()} · Aktivitas tim sales`}
        actions={
          <button
            type="button"
            onClick={() => navigate('/plan-visits')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <Plus size={16} /> Plan Visit
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map(i => <SkeletonBlock key={i} className="h-[118px] rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:gap-4 xl:grid-cols-4">
            <StatTile
              label="Visit bulan ini"
              icon={Calendar}
              value={stats?.visitsThisMonth ?? '–'}
              to="/realisasi-visits"
              context={`${stats?.salesCount ?? 0} sales aktif`}
            />
            <StatTile
              label="Tingkat realisasi"
              icon={TrendingUp}
              value={`${stats?.completionRate ?? 0}%`}
              context={`${stats?.completedVisits ?? 0} dari ${stats?.planVisits ?? 0} plan visit terealisasi`}
            >
              <div className="mt-3"><Meter value={stats?.completionRate ?? 0} size="sm" label="Tingkat realisasi visit" /></div>
            </StatTile>
            <StatTile
              label="Customer"
              icon={Users}
              value={stats?.customers ?? '–'}
              to="/customers"
              context="Total customer terdaftar"
            />
            <StatTile
              label="Perlu tindakan"
              icon={ClipboardCheck}
              value={actionCount}
              tone={actionCount ? 'warning' : 'good'}
              context={actionCount ? `${pendingVisits.length} approval · ${stats?.activeWarnings || warnings.length} peringatan` : 'Tidak ada yang tertunda'}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              {/* Approvals: the manager's main job on this page */}
              <SectionCard
                title="Menunggu persetujuan"
                description="Kunjungan tidak terencana dari tim, belum masuk laporan sebelum disetujui"
                action={pendingVisits.length > 0 && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/25">
                    {pendingVisits.length} menunggu
                  </span>
                )}
                bodyClassName=""
              >
                {pendingVisits.length === 0 ? (
                  <div className="flex items-center gap-3 px-5 py-6">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600"><CheckCircle size={18} /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Semua sudah ditinjau</p>
                      <p className="text-xs text-gray-500">Kunjungan baru dari tim akan muncul di sini.</p>
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {pendingVisits.map(visit => {
                      const busy = processingIds.has(visit.id)
                      return (
                        <li key={visit.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {visit.customer_name}
                              {visit.customer_company && <span className="font-normal text-gray-500"> · {visit.customer_company}</span>}
                            </p>
                            {visit.visit_purpose && <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{visit.visit_purpose}</p>}
                            <p className="mt-1.5 text-xs text-gray-500">
                              {visit.visitor?.name || '-'} · {formatDate(visit.visit_date)} · {VISIT_OUTCOME_LABELS[visit.visit_outcome] || visit.visit_outcome || '-'}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              onClick={() => setRejecting(visit)}
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            >
                              <XCircle size={15} /> Tolak
                            </button>
                            <button
                              onClick={() => handleApprove(visit)}
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                            >
                              <CheckCircle size={15} /> {busy ? 'Memproses…' : 'Setujui'}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </SectionCard>

              <SectionCard
                title="Jadwal visit terdekat"
                action={sortedUpcoming.length > 0 && <CardLink to="/plan-visits">Semua plan visit</CardLink>}
                bodyClassName=""
              >
                {sortedUpcoming.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="Belum ada visit terjadwal"
                    description="Buat plan visit untuk tim agar jadwal kunjungan terpantau di sini."
                  />
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {sortedUpcoming.map(visit => {
                      const days = daysUntil(visit.tanggal_visit)
                      return (
                        <li key={visit.id} className="flex items-center gap-4 px-5 py-3">
                          <div className="w-12 shrink-0 text-center">
                            <p className="text-[11px] font-medium uppercase text-gray-500">{formatDate(visit.tanggal_visit, { month: 'short' })}</p>
                            <p className="text-lg font-semibold leading-tight text-gray-900 tabular-nums">{formatDate(visit.tanggal_visit, { day: 'numeric' })}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{visit.customer_name || visit.customer?.name || 'Customer'}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-gray-500">
                              <MapPin size={12} className="shrink-0" aria-hidden="true" /> {visit.lokasi || '-'}
                            </p>
                          </div>
                          <div className="hidden shrink-0 text-right sm:block">
                            <p className="text-sm text-gray-700">{visit.assigned_to || 'Belum ditugaskan'}</p>
                            <p className={`text-xs ${days === 0 ? 'font-medium text-brand-700' : 'text-gray-500'}`}>{relativeDeadline(days)}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </SectionCard>
            </div>

            <div className="space-y-6">
              <SectionCard
                title="Performa sales"
                description="Realisasi plan visit per sales"
                action={<CardLink to="/visit-reports">Laporan</CardLink>}
                bodyClassName=""
              >
                {teamPerformance.length === 0 ? (
                  <EmptyState icon={Users} title="Belum ada sales aktif" />
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {teamPerformance.map(sales => (
                      <li key={sales.id} className="px-5 py-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-sm font-medium text-gray-900">{sales.name}</p>
                          <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">{Math.round(sales.completion_rate)}%</p>
                        </div>
                        <div className="mt-1.5"><Meter value={sales.completion_rate} size="sm" label={`Realisasi ${sales.name}`} /></div>
                        <p className="mt-1 text-xs text-gray-500">{sales.completed}/{sales.visits} visit · {sales.customers} customer</p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title="Peringatan" action={<CardLink to="/warnings">Semua</CardLink>} bodyClassName="">
                {warnings.length === 0 ? (
                  <div className="flex items-center gap-3 px-5 py-6">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600"><CheckCircle size={18} /></div>
                    <p className="text-sm text-gray-600">Tidak ada peringatan aktif.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {warnings.map(warning => (
                      <li key={warning.id}>
                        <Link to="/warnings" className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            <AlertTriangle size={15} aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-900">{warning.title}</span>
                            <span className="line-clamp-2 block text-xs text-gray-500">{warning.message}</span>
                            <span className="mt-0.5 block text-xs text-gray-400">{warning.user?.name || 'Sistem'} · {relativeTime(warning.created_at)}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title="Customer terbaru" action={<CardLink to="/customers">Semua</CardLink>} bodyClassName="">
                {recentCustomers.length === 0 ? (
                  <EmptyState icon={Users} title="Belum ada customer" />
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recentCustomers.map(customer => (
                      <li key={customer.id} className="flex items-center gap-3 px-5 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {(customer.company || customer.name || '?').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{customer.company || customer.name}</p>
                          <p className="truncate text-xs text-gray-500">{customer.company ? customer.name : (customer.phone || '-')}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </div>
        </>
      )}

      {rejecting && (
        <RejectDialog
          visit={rejecting}
          submitting={processingIds.has(rejecting.id)}
          onCancel={() => setRejecting(null)}
          onSubmit={handleReject}
        />
      )}
    </div>
  )
}
