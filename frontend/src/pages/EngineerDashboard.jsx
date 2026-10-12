import { useState, useEffect, useMemo, useCallback } from 'react'
import { FolderKanban, TrendingUp, FileText, Plus, Image, CheckCheck, MapPin } from '@icons'
import { api } from '../lib/api'
import useAuthStore from '../store/authStore'
import ProjectProgressUpdateModal from '../components/project/ProjectProgressUpdateModal'
import toast from 'react-hot-toast'
import {
  PageHeader, SectionCard, CardLink, StatTile, Meter, StatusBadge, EmptyState, SkeletonBlock,
  formatDate, daysUntil, relativeDeadline, relativeTime,
} from '../components/dashboard/DashboardUI'

const STATUS_RANK = { delayed: 0, at_risk: 1, on_track: 2, completed: 3 }

export default function EngineerDashboard() {
  const { user } = useAuthStore()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.getEngineerDashboard()
      if (response.success) setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboardData() }, [fetchDashboardData])

  const stats = dashboardData?.stats || {}
  const recentReports = dashboardData?.recent_reports || []

  // Active work first (most urgent on top), finished projects at the bottom.
  const projects = useMemo(() => (dashboardData?.assigned_projects || [])
    .map(p => ({ ...p, daysLeft: daysUntil(p.end_date || p.deadline) }))
    .sort((a, b) =>
      (STATUS_RANK[a.status] ?? 2) - (STATUS_RANK[b.status] ?? 2) ||
      (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)
    ), [dashboardData])

  const activeProjects = projects.filter(p => p.status !== 'completed')
  const firstName = (user?.name || '').split(' ')[0]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        title={firstName ? `Halo, ${firstName}` : 'Dashboard'}
        description={activeProjects.length
          ? `${activeProjects.length} proyek aktif yang kamu tangani`
          : 'Belum ada proyek aktif yang ditugaskan'}
      />

      {loading ? (
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map(i => <SkeletonBlock key={i} className="h-[118px] rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:gap-4 xl:grid-cols-4">
            <StatTile label="Proyek aktif" icon={FolderKanban} value={stats.in_progress_projects || 0} to="/engineer/projects" context={`${stats.total_projects || 0} proyek ditugaskan`} />
            <StatTile label="Rata-rata progress" icon={TrendingUp} value={`${stats.progress?.average ?? 0}%`} context="Semua proyek saya">
              <div className="mt-3"><Meter value={stats.progress?.average ?? 0} size="sm" label="Rata-rata progress" /></div>
            </StatTile>
            <StatTile label="Laporan dikirim" icon={FileText} value={stats.total_reports || 0} to="/engineer/progress-reports" context="Total laporan progress" />
            <StatTile label="Proyek selesai" icon={CheckCheck} value={stats.completed_projects || 0} context="Progress 100%" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <SectionCard
              className="xl:col-span-2"
              title="Proyek saya"
              description="Update progress langsung dari sini"
              action={projects.length > 0 && <CardLink to="/engineer/projects">Detail proyek</CardLink>}
              bodyClassName=""
            >
              {projects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="Belum ada proyek yang ditugaskan"
                  description="Site manager akan meng-assign kamu ke proyek. Proyeknya muncul di sini."
                />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {projects.map(project => {
                    const done = project.status === 'completed'
                    const overdue = !done && project.daysLeft !== null && project.daysLeft < 0
                    return (
                      <li key={project.id} className="px-5 py-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-medium text-gray-900">{project.name}</p>
                              <StatusBadge status={project.status} />
                            </div>
                            {project.location && (
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                                <MapPin size={12} className="shrink-0" aria-hidden="true" /> {project.location}
                              </p>
                            )}
                          </div>
                          {!done && (
                            <button
                              type="button"
                              onClick={() => setSelectedProject(project)}
                              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                            >
                              <Plus size={15} /> Update progress
                            </button>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <Meter value={project.progress || 0} size="sm" tone={done ? 'neutral' : undefined} label={`Progress ${project.name}`} />
                          <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-gray-900">{project.progress || 0}%</span>
                        </div>
                        <p className={`mt-1.5 text-xs ${overdue ? 'font-medium text-red-600' : 'text-gray-500'}`}>
                          Deadline {formatDate(project.end_date || project.deadline)}{!done && ` · ${relativeDeadline(project.daysLeft)}`}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Laporan terakhir" action={recentReports.length > 0 && <CardLink to="/engineer/progress-reports">Semua</CardLink>} bodyClassName="">
              {recentReports.length === 0 ? (
                <EmptyState icon={FileText} title="Belum ada laporan" description="Laporan progress yang kamu kirim akan tampil di sini." />
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recentReports.map(report => (
                    <li key={report.id} className="px-5 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium text-gray-900">{report.project?.name || 'Proyek'}</p>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">{report.progress_percentage}%</p>
                      </div>
                      {report.notes && <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{report.notes}</p>}
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                        {relativeTime(report.reported_at)}
                        {report.photo && (<><span aria-hidden="true">·</span><Image size={12} aria-hidden="true" /> Foto</>)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      )}

      <ProjectProgressUpdateModal
        open={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
        initialProgress={selectedProject?.engineer_progress_reports?.[0]?.progress_percentage || selectedProject?.progress || 0}
        onSaved={() => {
          setSelectedProject(null)
          fetchDashboardData()
        }}
      />
    </div>
  )
}
