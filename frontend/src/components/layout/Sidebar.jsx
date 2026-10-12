import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, FileText,
  BarChart3, Activity, Users,
  Calendar, CheckSquare, Clock, AlertTriangle, TrendingUp, X
} from '../../lib/icons.jsx'
import useAuthStore from '../../store/authStore'
import { normalizeRole } from '../../utils/roleUtils'
import clsx from 'clsx'
import amsarLogo from '../../assets/icon.ico?url'

// Notifications live in the topbar bell (with its unread badge), and profile/logout
// in the avatar menu, so the sidebar only carries the actual work areas.
const PROJECT_SECTION = {
  title: 'Proyek',
  items: [
    { to: '/projects', icon: FolderKanban, label: 'Proyek', tourId: 'projects' },
    { to: '/documents', icon: FileText, label: 'Dokumen', tourId: 'documents' },
    { to: '/reports', icon: BarChart3, label: 'Laporan', tourId: 'reports' },
  ],
}

const FUNNEL_SECTION = {
  title: 'Penjualan',
  items: [
    { to: '/funnels', icon: TrendingUp, label: 'Sales Funnel', tourId: 'funnels' },
  ],
}

const NAV_SECTIONS = {
  administrator: [
    { items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', tourId: 'dashboard' }] },
    PROJECT_SECTION,
    {
      title: 'Kunjungan Sales',
      items: [
        { to: '/customers', icon: Users, label: 'Customer', tourId: 'customers' },
        { to: '/plan-visits', icon: Calendar, label: 'Plan Visit', tourId: 'plan-visits' },
        { to: '/realisasi-visits', icon: CheckSquare, label: 'Realisasi Visit', tourId: 'realisasi-visits' },
        { to: '/visit-reports', icon: BarChart3, label: 'Laporan Visit', tourId: 'visit-reports' },
        { to: '/warnings', icon: AlertTriangle, label: 'Peringatan', tourId: 'warnings' },
      ],
    },
    FUNNEL_SECTION,
    {
      title: 'Administrasi',
      items: [
        { to: '/users', icon: Users, label: 'Manajemen User', tourId: 'users' },
        { to: '/admin/attendance-monitor', icon: Clock, label: 'Monitor Absensi', tourId: 'admin-attendance-monitor' },
        { to: '/activity', icon: Activity, label: 'Log Aktivitas', tourId: 'activity' },
      ],
    },
  ],
  site_manager: [
    { items: [{ to: '/site/dashboard', icon: LayoutDashboard, label: 'Dashboard', tourId: 'dashboard' }] },
    PROJECT_SECTION,
  ],
  sales_manager: [
    { items: [{ to: '/manager/dashboard', icon: LayoutDashboard, label: 'Dashboard', tourId: 'dashboard' }] },
    {
      title: 'Kunjungan Sales',
      items: [
        { to: '/customers', icon: Users, label: 'Customer', tourId: 'customers' },
        { to: '/plan-visits', icon: Calendar, label: 'Plan Visit', tourId: 'plan-visits' },
        { to: '/realisasi-visits', icon: CheckSquare, label: 'Realisasi Visit', tourId: 'realisasi-visits' },
        { to: '/visit-reports', icon: BarChart3, label: 'Laporan Visit', tourId: 'visit-reports' },
        { to: '/warnings', icon: AlertTriangle, label: 'Peringatan', tourId: 'warnings' },
      ],
    },
    FUNNEL_SECTION,
    {
      title: 'Saya',
      items: [{ to: '/attendance', icon: Clock, label: 'Absensi', tourId: 'attendance' }],
    },
  ],
  sales: [
    { items: [{ to: '/sales/dashboard', icon: LayoutDashboard, label: 'Dashboard', tourId: 'dashboard' }] },
    {
      title: 'Kunjungan',
      items: [
        { to: '/customers', icon: Users, label: 'Customer', tourId: 'customers' },
        { to: '/plan-visits', icon: Calendar, label: 'Plan Visit', tourId: 'plan-visits' },
        { to: '/realisasi-visits', icon: CheckSquare, label: 'Realisasi Visit', tourId: 'realisasi-visits' },
        { to: '/visit-reports', icon: BarChart3, label: 'Laporan Visit', tourId: 'visit-reports' },
      ],
    },
    FUNNEL_SECTION,
    {
      title: 'Saya',
      items: [{ to: '/attendance', icon: Clock, label: 'Absensi', tourId: 'attendance' }],
    },
  ],
  engineer: [
    { items: [{ to: '/engineer/dashboard', icon: LayoutDashboard, label: 'Dashboard', tourId: 'dashboard' }] },
    {
      title: 'Pekerjaan',
      items: [
        { to: '/engineer/projects', icon: FolderKanban, label: 'Proyek Saya', tourId: 'projects' },
        { to: '/engineer/progress-reports', icon: FileText, label: 'Laporan Progress', tourId: 'progress-reports' },
      ],
    },
  ],
}

export default function Sidebar({ mobileOpen = false, onClose, onNavigate }) {
  const { user } = useAuthStore()
  const sections = NAV_SECTIONS[normalizeRole(user?.role)] || NAV_SECTIONS.engineer

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-gray-900/40 transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex h-dvh w-64 max-w-[86vw] shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-200',
          'lg:pointer-events-auto lg:static lg:z-auto lg:h-full lg:translate-x-0',
          mobileOpen ? 'pointer-events-auto translate-x-0 shadow-xl' : 'pointer-events-none -translate-x-full'
        )}
        data-tour="sidebar"
        aria-label="Navigasi utama"
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-5">
          <img src={amsarLogo} alt="" className="h-9 w-9 object-contain" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-gray-900">PT Amsar</p>
            <p className="truncate text-xs text-gray-500">Prima Mandiri</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section, sectionIndex) => (
            <div key={section.title ?? sectionIndex} className={sectionIndex > 0 ? 'mt-6' : ''}>
              {section.title && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label, tourId }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={onNavigate}
                      data-tour={tourId}
                      className={({ isActive }) =>
                        clsx(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-brand-50 font-semibold text-brand-700'
                            : 'font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-brand-600" aria-hidden="true" />
                          )}
                          <Icon
                            size={18}
                            className={clsx('shrink-0', isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-500')}
                          />
                          <span className="truncate">{label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
