import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PriorityBadge from '../../components/PriorityBadge'
import StatusBadge from '../../components/StatusBadge'
import { fetchAllReports } from '../../lib/admin'
import { formatReportDate, getCategoryLabel } from '../../lib/reports'
import {
  CATEGORIES,
  STATUSES,
  type Category,
  type Report,
  type Status,
} from '../../types'

/**
 * Administrator dashboard displaying submitted civic reports with status/category filters.
 * Server-side authorization is enforced by Supabase RLS.
 */
export default function AdminDashboardPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllReports()
      setReports(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load reports. Verify administrator permissions and try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (statusFilter !== 'all' && report.status !== statusFilter) {
        return false
      }
      if (categoryFilter !== 'all' && report.category !== categoryFilter) {
        return false
      }
      return true
    })
  }, [reports, statusFilter, categoryFilter])

  const stats = useMemo(() => {
    const openCount = reports.filter(
      (r) => r.status !== 'resolved' && r.status !== 'rejected',
    ).length
    const highPriorityCount = reports.filter(
      (r) =>
        r.priority === 'high' &&
        r.status !== 'resolved' &&
        r.status !== 'rejected',
    ).length
    const resolvedCount = reports.filter((r) => r.status === 'resolved').length

    return [
      { label: 'Total Reports', value: reports.length },
      { label: 'Open Reports', value: openCount },
      { label: 'High Priority Open', value: highPriorityCount },
      { label: 'Resolved', value: resolvedCount },
    ]
  }, [reports])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Review, prioritize, and resolve citizen-reported civic issues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="badge border border-orange-200 bg-orange-50 text-orange-700"
            aria-label="Access restricted to administrators"
          >
            Admin only
          </span>
          <button
            type="button"
            onClick={() => {
              void loadReports()
            }}
            disabled={loading}
            aria-label="Refresh admin reports"
            className="btn-secondary"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Counts */}
      <div
        className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Dashboard statistics"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="text-3xl font-bold text-civic-700">
              {loading && reports.length === 0 ? '—' : stat.value}
            </div>
            <div className="mt-1 text-sm font-medium text-gray-900">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Report Queue */}
      <div className="card">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Report Queue</h2>
          <div className="flex flex-wrap gap-3">
            <div>
              <label htmlFor="admin-status-filter" className="sr-only">
                Filter by status
              </label>
              <select
                id="admin-status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | Status)
                }}
                className="form-input mt-0 py-1.5 text-sm"
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="admin-category-filter" className="sr-only">
                Filter by category
              </label>
              <select
                id="admin-category-filter"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as 'all' | Category)
                }}
                className="form-input mt-0 py-1.5 text-sm"
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && reports.length === 0 ? (
          <div className="py-12 text-center" role="status" aria-live="polite">
            <p className="text-sm font-medium text-gray-600">
              Loading report queue...
            </p>
          </div>
        ) : error ? (
          <div
            className="rounded-md border border-danger-500/30 bg-danger-50 p-6 text-center"
            role="alert"
          >
            <p className="text-sm font-medium text-danger-700">{error}</p>
            <button
              type="button"
              onClick={() => {
                void loadReports()
              }}
              className="btn-secondary mt-4"
            >
              Try again
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-12 text-center" aria-label="No reports to display">
            <div className="mb-3 text-4xl" aria-hidden="true">
              📥
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No matching reports
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {reports.length === 0
                ? 'No civic reports have been submitted yet.'
                : 'Try adjusting the status or category filters.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200" role="list" aria-label="Admin report queue">
            {filteredReports.map((report) => (
              <li key={report.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {report.title}
                      </h3>
                      <StatusBadge status={report.status} />
                      <PriorityBadge priority={report.priority} />
                    </div>
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                      <div>
                        <dt className="inline font-medium text-gray-700">
                          Category:{' '}
                        </dt>
                        <dd className="inline">
                          {getCategoryLabel(report.category)}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-gray-700">
                          Location:{' '}
                        </dt>
                        <dd className="inline">{report.location_text}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-gray-700">
                          Submitted:{' '}
                        </dt>
                        <dd className="inline">
                          <time dateTime={report.created_at}>
                            {formatReportDate(report.created_at)}
                          </time>
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="shrink-0">
                    <Link
                      to={`/admin/reports/${report.id}`}
                      className="btn-primary"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
