import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { AlertCircle, AlertTriangle, CheckCheck, CheckCircle, ArrowRight } from '../../lib/icons.jsx'

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const compactRupiah = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 })

/** Rp 1,2 M / Rp 350 jt — for tiles where width is tight. */
export const formatRupiahCompact = (value) => `Rp ${compactRupiah.format(Number(value) || 0)}`

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', options)
}

/**
 * Local calendar day of a backend date. Handles plain "YYYY-MM-DD" (local midnight)
 * and Laravel's serialized dates like "2026-10-11T17:00:00.000000Z", which is
 * midnight WIB in UTC — slicing that string would give the previous day.
 */
export const toLocalDay = (value) => {
  if (!value) return null
  const s = String(value)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : new Date(s.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

/** Whole calendar days from today until `value` (negative = overdue). */
export const daysUntil = (value) => {
  const target = toLocalDay(value)
  if (!target) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target - today) / 86400000)
}

export const relativeDeadline = (days) => {
  if (days === null) return ''
  if (days < 0) return `Telat ${Math.abs(days)} hari`
  if (days === 0) return 'Hari ini'
  if (days === 1) return 'Besok'
  return `${days} hari lagi`
}

export const relativeTime = (value) => {
  if (!value) return ''
  const diff = (Date.now() - new Date(String(value).replace(' ', 'T')).getTime()) / 1000
  if (Number.isNaN(diff)) return ''
  if (diff < 60) return 'Baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} hari lalu`
  return formatDate(value, { day: 'numeric', month: 'short' })
}

// ---------------------------------------------------------------------------
// Status: always icon + label, never color alone
// ---------------------------------------------------------------------------

export const PROJECT_STATUS = {
  on_track:  { label: 'On Track',  icon: CheckCircle,   className: 'bg-green-50 text-green-700 ring-green-600/20' },
  at_risk:   { label: 'Berisiko',  icon: AlertTriangle, className: 'bg-amber-50 text-amber-800 ring-amber-600/25' },
  delayed:   { label: 'Terlambat', icon: AlertCircle,   className: 'bg-red-50 text-red-700 ring-red-600/20' },
  completed: { label: 'Selesai',   icon: CheckCheck,    className: 'bg-gray-100 text-gray-700 ring-gray-500/20' },
}

export function StatusBadge({ status, map = PROJECT_STATUS }) {
  const config = map[status] || { label: status || '-', icon: null, className: 'bg-gray-100 text-gray-700 ring-gray-500/20' }
  const Icon = config.icon
  return (
    <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', config.className)}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {config.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Layout pieces
// ---------------------------------------------------------------------------

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionCard({ title, description, action, children, className, bodyClassName }) {
  return (
    <section className={clsx('min-w-0 rounded-xl border border-gray-200 bg-white shadow-card', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={clsx(bodyClassName ?? 'p-5')}>{children}</div>
    </section>
  )
}

export function CardLink({ to, children }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline">
      {children}
      <ArrowRight size={12} aria-hidden="true" />
    </Link>
  )
}

/**
 * Stat tile: label, one headline number, and one line of context.
 * `tone` only colors the context line (e.g. "2 terlambat"), never the number.
 */
export function StatTile({ label, value, context, tone = 'neutral', icon: Icon, to, children }) {
  const toneClass = {
    neutral: 'text-gray-500',
    good: 'text-green-700',
    warning: 'text-amber-700',
    critical: 'text-red-600',
  }[tone]

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
        {Icon && <Icon size={18} className="hidden shrink-0 text-gray-400 sm:block" aria-hidden="true" />}
      </div>
      <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-gray-900 tabular-nums sm:text-[28px]">{value}</p>
      {children}
      {context && <p className={clsx('mt-2 text-xs font-medium', toneClass)}>{context}</p>}
    </>
  )

  const className = 'block min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-card sm:p-5'
  return to ? (
    <Link to={to} className={clsx(className, 'transition-colors hover:border-gray-300 hover:bg-gray-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

/** Progress / usage track. Over 100% turns critical and is clamped visually. */
export function Meter({ value, max = 100, tone, size = 'md', label }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const resolvedTone = tone ?? (pct > 100 ? 'critical' : 'brand')
  const fill = {
    brand: 'bg-brand-600',
    good: 'bg-green-600',
    warning: 'bg-amber-500',
    critical: 'bg-red-600',
    neutral: 'bg-gray-400',
  }[resolvedTone]

  return (
    <div
      className={clsx('w-full overflow-hidden rounded-full bg-gray-100', size === 'sm' ? 'h-1.5' : 'h-2')}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={clsx('h-full rounded-full transition-[width] duration-500', fill)} style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }} />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Icon size={22} aria-hidden="true" />
        </div>
      )}
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SkeletonBlock({ className }) {
  return <div className={clsx('animate-pulse rounded-md bg-gray-100', className)} />
}
