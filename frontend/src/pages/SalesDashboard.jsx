import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Calendar, Clock, MapPin, Target, AlertCircle, Plus, CheckSquare, RefreshCw, ArrowRight } from '@icons'
import useAuthStore from '../store/authStore'
import { request } from '../lib/api'
import {
  PageHeader, SectionCard, CardLink, StatTile, Meter, EmptyState, SkeletonBlock,
  formatDate, daysUntil, relativeDeadline,
} from '../components/dashboard/DashboardUI'

const uniqueById = (list) => Array.from(new Map((list || []).map(item => [item.id, item])).values())

const todayLabel = () => new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })

export default function SalesDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)
  const isFetchingRef = useRef(false)

  const fetchDashboardData = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setLoading(true)
    setFailed(false)
    try {
      const response = await request('/dashboard/sales', { method: 'GET' })
      if (response.success) setData(response.data)
      else setFailed(true)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setFailed(true)
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  const stats = data?.stats || {}
  const customers = useMemo(() => uniqueById(data?.my_customers), [data])
  const visits = useMemo(
    () => uniqueById(data?.my_visits).map(v => ({ ...v, daysLeft: daysUntil(v.tanggal_visit) })),
    [data]
  )
  const overdueCount = visits.filter(v => v.daysLeft !== null && v.daysLeft < 0).length
  const todayCount = visits.filter(v => v.daysLeft === 0).length
  const firstName = (user?.name || '').split(' ')[0]

  if (!loading && failed) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <EmptyState
          icon={AlertCircle}
          title="Dashboard gagal dimuat"
          description="Periksa koneksi lalu coba lagi."
          action={
            <button onClick={fetchDashboardData} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <RefreshCw size={15} /> Coba lagi
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        title={firstName ? `Halo, ${firstName}` : 'Dashboard'}
        description={
          loading ? todayLabel() :
          `${todayLabel()} · ${todayCount ? `${todayCount} visit hari ini` : 'Tidak ada visit hari ini'}${overdueCount ? ` · ${overdueCount} terlambat` : ''}`
        }
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('/create-unplanned-visit')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus size={16} /> Visit dadakan
            </button>
            <button
              type="button"
              onClick={() => navigate('/realisasi-visits')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <CheckSquare size={16} /> Catat visit
            </button>
          </>
        }
      />

      {data?.attendance_warning && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center" role="status">
          <Clock size={20} className="shrink-0 text-amber-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">Kamu belum absen hari ini</p>
            <p className="text-sm text-amber-800">Absen dulu sebelum mulai kunjungan.</p>
          </div>
          <button
            onClick={() => navigate('/attendance')}
            className="rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Absen sekarang
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map(i => <SkeletonBlock key={i} className="h-[118px] rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:gap-4 xl:grid-cols-4">
            <StatTile
              label="Target bulan ini"
              icon={Target}
              value={`${stats.monthly_completion || 0}%`}
              context={`${stats.monthly_completed || 0} dari ${stats.monthly_visits || 0} visit terealisasi`}
            >
              <div className="mt-3"><Meter value={stats.monthly_completion || 0} size="sm" label="Target bulan ini" /></div>
            </StatTile>
            <StatTile
              label="Visit belum direalisasi"
              icon={Calendar}
              value={stats.assigned_visits || 0}
              to="/realisasi-visits"
              tone={overdueCount ? 'critical' : 'neutral'}
              context={overdueCount ? `${overdueCount} sudah lewat tanggal` : 'Semua sesuai jadwal'}
            />
            <StatTile
              label="Visit terlewat"
              icon={AlertCircle}
              value={stats.monthly_missed || 0}
              tone={stats.monthly_missed ? 'critical' : 'good'}
              context="Bulan ini"
            />
            <StatTile
              label="Customer saya"
              icon={Users}
              value={stats.my_customers || 0}
              to="/customers"
              context={`${stats.completed_visits || 0} visit selesai total`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <SectionCard
              className="xl:col-span-2"
              title="Jadwal visit saya"
              description="Yang terlambat ditampilkan paling atas"
              action={visits.length > 0 && <CardLink to="/realisasi-visits">Buka realisasi</CardLink>}
              bodyClassName=""
            >
              {visits.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Tidak ada visit yang menunggu"
                  description="Buat plan visit baru atau catat kunjungan yang tidak terencana."
                  action={
                    <button onClick={() => navigate('/plan-visits')} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
                      <Plus size={16} /> Plan visit
                    </button>
                  }
                />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {visits.map(visit => {
                    const overdue = visit.daysLeft !== null && visit.daysLeft < 0
                    const isToday = visit.daysLeft === 0
                    return (
                      <li key={visit.id}>
                        <Link to="/realisasi-visits" className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-gray-50">
                          <div className={`w-12 shrink-0 rounded-lg py-1 text-center ${overdue ? 'bg-red-50' : isToday ? 'bg-brand-50' : 'bg-gray-50'}`}>
                            <p className={`text-[11px] font-medium uppercase ${overdue ? 'text-red-600' : isToday ? 'text-brand-700' : 'text-gray-500'}`}>
                              {formatDate(visit.tanggal_visit, { month: 'short' })}
                            </p>
                            <p className="text-lg font-semibold leading-tight text-gray-900 tabular-nums">{formatDate(visit.tanggal_visit, { day: 'numeric' })}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {visit.customer?.name || 'Customer'}
                              {visit.customer?.company && <span className="font-normal text-gray-500"> · {visit.customer.company}</span>}
                            </p>
                            <p className="flex items-center gap-1 truncate text-xs text-gray-500">
                              <MapPin size={12} className="shrink-0" aria-hidden="true" />
                              {visit.lokasi || '-'}{visit.waktu_visit ? ` · ${String(visit.waktu_visit).slice(0, 5)}` : ''}
                            </p>
                          </div>
                          <span className={`hidden shrink-0 text-xs sm:block ${overdue ? 'font-medium text-red-600' : isToday ? 'font-medium text-brand-700' : 'text-gray-500'}`}>
                            {relativeDeadline(visit.daysLeft)}
                          </span>
                          <ArrowRight size={16} className="shrink-0 text-gray-300 group-hover:text-gray-500" aria-hidden="true" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Customer saya" action={<CardLink to="/customers">Semua</CardLink>} bodyClassName="">
              {customers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Belum ada customer"
                  action={<CardLink to="/customers">Tambah customer</CardLink>}
                />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {customers.map(customer => (
                    <li key={customer.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {(customer.company || customer.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{customer.company || customer.name}</p>
                        <p className="truncate text-xs text-gray-500">{customer.company ? customer.name : customer.phone || '-'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
