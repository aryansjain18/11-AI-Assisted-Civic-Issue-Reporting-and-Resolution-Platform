import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAnalyticsSummary } from '../lib/analytics'
import { CATEGORIES, STATUSES } from '../types'
import type { AnalyticsSummary } from '../types'

/** Tailwind background classes for status bars */
const STATUS_BAR_COLORS: Record<string, string> = {
  submitted: 'bg-blue-500',
  under_review: 'bg-amber-500',
  in_progress: 'bg-sky-500',
  resolved: 'bg-emerald-500',
  rejected: 'bg-red-500',
}

/** Tailwind background classes for category bars */
const CATEGORY_BAR_COLORS: Record<string, string> = {
  pothole: 'bg-orange-500',
  garbage: 'bg-lime-600',
  water_leak: 'bg-blue-500',
  streetlight: 'bg-yellow-500',
  drainage: 'bg-indigo-500',
  other: 'bg-gray-400',
}

interface TrendDay {
  date: string
  count: number
  label: string
}

function buildTrendDays(
  dailyCounts: Array<{ report_date: string; count: number }>,
): TrendDay[] {
  const countMap = new Map(dailyCounts.map((d) => [d.report_date, d.count]))
  const days: TrendDay[] = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const key = `${year}-${month}-${day}`
    const label = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(d)
    days.push({ date: key, count: countMap.get(key) ?? 0, label })
  }

  return days
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAnalyticsSummary()
      setSummary(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load analytics right now. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  /* ---- Derived values ---- */

  const openCount = summary
    ? (summary.by_status['submitted'] ?? 0) +
      (summary.by_status['under_review'] ?? 0) +
      (summary.by_status['in_progress'] ?? 0)
    : 0

  const resolvedCount = summary?.by_status['resolved'] ?? 0
  const rejectedCount = summary?.by_status['rejected'] ?? 0

  const statusEntries = useMemo(() => {
    if (!summary) return []
    return STATUSES.map((s) => ({
      key: s.value,
      label: s.label,
      count: summary.by_status[s.value] ?? 0,
      color: STATUS_BAR_COLORS[s.value] ?? 'bg-gray-400',
    }))
  }, [summary])

  const maxStatusCount = useMemo(
    () => Math.max(1, ...statusEntries.map((e) => e.count)),
    [statusEntries],
  )

  const categoryEntries = useMemo(() => {
    if (!summary) return []
    return CATEGORIES.map((c) => ({
      key: c.value,
      label: c.label,
      count: summary.by_category[c.value] ?? 0,
      color: CATEGORY_BAR_COLORS[c.value] ?? 'bg-gray-400',
    }))
  }, [summary])

  const maxCategoryCount = useMemo(
    () => Math.max(1, ...categoryEntries.map((e) => e.count)),
    [categoryEntries],
  )

  const trendDays = useMemo(
    () => (summary ? buildTrendDays(summary.daily_counts) : []),
    [summary],
  )

  const maxDailyCount = useMemo(
    () => Math.max(1, ...trendDays.map((d) => d.count)),
    [trendDays],
  )

  /* ---- Render ---- */

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-gray-600">
            Community issue statistics based on submitted reports. Only
            aggregate counts are displayed — no personal information is exposed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadAnalytics()
          }}
          disabled={loading}
          className="btn-secondary"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Loading */}
      {loading && !summary ? (
        <div
          className="card flex min-h-72 items-center justify-center text-center"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-gray-600">
            Loading analytics…
          </p>
        </div>
      ) : error ? (
        /* Error */
        <div
          className="card border-danger-500/30 bg-danger-50 text-center"
          role="alert"
        >
          <p className="text-sm font-medium text-danger-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              void loadAnalytics()
            }}
            className="btn-secondary mt-4"
          >
            Try again
          </button>
        </div>
      ) : summary && summary.total === 0 ? (
        /* Empty */
        <div
          className="card flex min-h-72 flex-col items-center justify-center text-center"
          aria-label="No analytics data available"
        >
          <div className="mb-3 text-5xl" aria-hidden="true">
            📊
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No reports have been submitted yet
          </h2>
          <p className="mt-1 max-w-md text-sm text-gray-600">
            Once community members submit civic issues, aggregate statistics
            will appear here.
          </p>
        </div>
      ) : summary ? (
        <div className="space-y-8">
          {/* Summary stat cards */}
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Summary statistics"
          >
            {[
              { label: 'Total Reports', value: summary.total },
              { label: 'Open Issues', value: openCount },
              { label: 'Resolved', value: resolvedCount },
              { label: 'Rejected', value: rejectedCount },
            ].map((stat) => (
              <div key={stat.label} className="card text-center">
                <div
                  className="text-3xl font-bold text-civic-700"
                  aria-label={`${stat.label}: ${stat.value}`}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Two-column grid: status + category */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Status breakdown */}
            <section className="card" aria-labelledby="status-breakdown-heading">
              <h2
                id="status-breakdown-heading"
                className="mb-4 text-lg font-semibold text-gray-900"
              >
                Reports by Status
              </h2>
              <ul
                className="space-y-3"
                aria-label="Status breakdown"
              >
                {statusEntries.map((entry) => (
                  <li key={entry.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {entry.label}
                      </span>
                      <span
                        className="text-gray-500"
                        aria-label={`${entry.label}: ${entry.count}`}
                      >
                        {entry.count}
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
                      role="progressbar"
                      aria-valuenow={entry.count}
                      aria-valuemin={0}
                      aria-valuemax={maxStatusCount}
                      aria-label={`${entry.label}: ${entry.count}`}
                    >
                      <div
                        className={`h-2 rounded-full transition-all ${entry.color}`}
                        style={{
                          width:
                            entry.count > 0
                              ? `${Math.max((entry.count / maxStatusCount) * 100, 2)}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Category breakdown */}
            <section
              className="card"
              aria-labelledby="category-breakdown-heading"
            >
              <h2
                id="category-breakdown-heading"
                className="mb-4 text-lg font-semibold text-gray-900"
              >
                Reports by Category
              </h2>
              <ul
                className="space-y-3"
                aria-label="Category breakdown"
              >
                {categoryEntries.map((entry) => (
                  <li key={entry.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {entry.label}
                      </span>
                      <span
                        className="text-gray-500"
                        aria-label={`${entry.label}: ${entry.count}`}
                      >
                        {entry.count}
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
                      role="progressbar"
                      aria-valuenow={entry.count}
                      aria-valuemin={0}
                      aria-valuemax={maxCategoryCount}
                      aria-label={`${entry.label}: ${entry.count}`}
                    >
                      <div
                        className={`h-2 rounded-full transition-all ${entry.color}`}
                        style={{
                          width:
                            entry.count > 0
                              ? `${Math.max((entry.count / maxCategoryCount) * 100, 2)}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* 30-day trend */}
          <section className="card" aria-labelledby="trend-heading">
            <h2
              id="trend-heading"
              className="mb-4 text-lg font-semibold text-gray-900"
            >
              Report Trend (Last 30 Days)
            </h2>

            {trendDays.every((d) => d.count === 0) ? (
              <div
                className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center"
                role="status"
              >
                <p className="text-sm text-gray-600">
                  No reports submitted in the last 30 days.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="flex h-40 items-end gap-px"
                  role="img"
                  aria-label="Bar chart showing report submissions over the last 30 days"
                >
                  {trendDays.map((day) => (
                    <div
                      key={day.date}
                      className="flex-1 rounded-t bg-civic-500 transition-all hover:bg-civic-600"
                      style={{
                        height:
                          day.count > 0
                            ? `${Math.max((day.count / maxDailyCount) * 100, 3)}%`
                            : '0%',
                      }}
                      title={`${day.label}: ${day.count} report${day.count === 1 ? '' : 's'}`}
                      aria-label={`${day.label}: ${day.count} report${day.count === 1 ? '' : 's'}`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>{trendDays[0]?.label ?? ''}</span>
                  <span>Last 30 days</span>
                  <span>{trendDays[trendDays.length - 1]?.label ?? ''}</span>
                </div>
              </>
            )}

            {/* Screen-reader accessible data table */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-civic-700 hover:text-civic-800">
                View trend data as table
              </summary>
              <div className="mt-2 max-h-60 overflow-y-auto">
                <table className="w-full text-sm" aria-label="Daily report counts">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-1 text-left font-medium text-gray-700">
                        Date
                      </th>
                      <th className="py-1 text-right font-medium text-gray-700">
                        Reports
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendDays
                      .filter((d) => d.count > 0)
                      .map((day) => (
                        <tr
                          key={day.date}
                          className="border-b border-gray-100"
                        >
                          <td className="py-1 text-gray-600">{day.label}</td>
                          <td className="py-1 text-right text-gray-900">
                            {day.count}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        </div>
      ) : null}
    </div>
  )
}
