import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PriorityBadge from '../components/PriorityBadge'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../hooks/useAuth'
import {
  fetchMyReports,
  formatReportDate,
  getCategoryLabel,
} from '../lib/reports'
import type { Report } from '../types'

/**
 * Protected citizen report list page.
 * The query explicitly filters by the authenticated user's ID.
 * Database RLS remains responsible for enforcing access.
 */
export default function MyReportsPage() {
  const { user, loading: authLoading } = useAuth()

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    // Do not query until Supabase authentication has been restored.
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setReports([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await fetchMyReports(user.id)
      setReports(data)
    } catch (err) {
      console.error('My reports loading failed:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your reports right now. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Reports</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track the status and priority of civic issues you have submitted.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void loadReports()
            }}
            disabled={loading || authLoading}
            aria-label="Refresh my reports"
            className="btn-secondary"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          <Link to="/reports/new" className="btn-primary">
            Report new issue
          </Link>
        </div>
      </div>

      {authLoading || (loading && reports.length === 0) ? (
        <div
          className="card flex flex-col items-center py-16 text-center"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-gray-600">
            Checking your account and loading reports...
          </p>
        </div>
      ) : error ? (
        <div
          className="card border-danger-500/30 bg-danger-50 text-center"
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
      ) : !user ? (
        <div className="card text-center">
          <p className="text-sm text-gray-600">
            Please sign in to view your reports.
          </p>
          <Link to="/sign-in" className="btn-primary mt-4 inline-block">
            Sign in
          </Link>
        </div>
      ) : reports.length === 0 ? (
        <div
          className="card flex flex-col items-center py-16 text-center"
          aria-label="No reports found"
        >
          <div className="mb-4 text-5xl" aria-hidden="true">
            📋
          </div>

          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            No reports yet
          </h2>

          <p className="mb-6 max-w-sm text-sm text-gray-600">
            When you submit civic issue reports, they&apos;ll appear here with
            their current status and priority.
          </p>

          <Link to="/reports/new" className="btn-primary">
            Report your first issue
          </Link>
        </div>
      ) : (
        <ul className="space-y-4" role="list" aria-label="Submitted reports">
          {reports.map((report) => (
            <li key={report.id}>
              <article className="card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {report.title}
                    </h2>

                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <StatusBadge status={report.status} />
                    <PriorityBadge priority={report.priority} />
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 text-sm text-gray-600 sm:grid-cols-3">
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
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}