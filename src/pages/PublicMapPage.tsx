
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PriorityBadge from '../components/PriorityBadge'
import StatusBadge from '../components/StatusBadge'
import {
  fetchPublicReports,
  formatReportDate,
  getCategoryLabel,
} from '../lib/reports'
import type { PublicReportSummary } from '../types'

interface MappedMarker {
  report: PublicReportSummary
  lat: number
  lng: number
  xPercent: number
  yPercent: number
}

function parseCoordinates(
  report: PublicReportSummary,
): { lat: number; lng: number } | null {
  if (report.location_lat === null || report.location_lng === null) {
    return null
  }

  const lat = report.location_lat
  const lng = report.location_lng

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null
  }

  return { lat, lng }
}

function projectMarkers(reports: PublicReportSummary[]): MappedMarker[] {
  const valid = reports
    .map((report) => {
      const coords = parseCoordinates(report)

      return coords
        ? { report, lat: coords.lat, lng: coords.lng }
        : null
    })
    .filter(
      (
        item,
      ): item is {
        report: PublicReportSummary
        lat: number
        lng: number
      } => item !== null,
    )

  if (valid.length === 0) {
    return []
  }

  const lats = valid.map((item) => item.lat)
  const lngs = valid.map((item) => item.lng)

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const latSpan = maxLat - minLat
  const lngSpan = maxLng - minLng

  return valid.map(({ report, lat, lng }) => {
    const xPercent =
      lngSpan === 0 ? 50 : 12 + ((lng - minLng) / lngSpan) * 76

    const yPercent =
      latSpan === 0 ? 50 : 12 + ((maxLat - lat) / latSpan) * 76

    return {
      report,
      lat,
      lng,
      xPercent,
      yPercent,
    }
  })
}

/**
 * Public civic issue coordinate map.
 *
 * Uses approximate coordinates supplied by the public reports RPC.
 * Provides a keyboard-accessible report list as an alternative to markers.
 */
export default function PublicMapPage() {
  const [reports, setReports] = useState<PublicReportSummary[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchPublicReports()

      setReports(data)

      setSelectedId((previous) => {
        if (previous && data.some((report) => report.id === previous)) {
          return previous
        }

        const firstMapped = data.find(
          (report) => parseCoordinates(report) !== null,
        )

        if (firstMapped) {
          return firstMapped.id
        }

        return data.length > 0 ? data[0].id : null
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load public reports right now. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const markers = useMemo(() => projectMarkers(reports), [reports])

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedId) ?? null,
    [reports, selectedId],
  )

  const selectedCoords = useMemo(
    () => (selectedReport ? parseCoordinates(selectedReport) : null),
    [selectedReport],
  )

  const unmappedCount = reports.length - markers.length

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Community Issue Map
          </h1>

          <p className="mt-1 text-gray-600">
            Explore civic issues using approximate locations. Report titles,
            descriptions, and exact addresses are not shown publicly.
          </p>

          <p className="mt-2 text-xs text-gray-500">
            Map positions are approximate and should not be used for precise
            navigation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void loadReports()
            }}
            disabled={loading}
            aria-label="Refresh public reports"
            className="btn-secondary"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          <Link to="/reports/new" className="btn-primary">
            Report Issue
          </Link>
        </div>
      </div>

      {loading && reports.length === 0 ? (
        <div
          className="card flex min-h-72 items-center justify-center text-center"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-gray-600">
            Loading public reports...
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
      ) : reports.length === 0 ? (
        <div
          className="card flex min-h-72 flex-col items-center justify-center text-center"
          aria-label="No public reports found"
        >
          <div className="mb-3 text-5xl" aria-hidden="true">
            🗺️
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            No active public reports yet
          </h2>

          <p className="mt-1 max-w-md text-sm text-gray-600">
            When community members submit civic issues, limited public
            summaries will appear here.
          </p>

          <Link to="/reports/new" className="btn-primary mt-6">
            Report an issue
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="card" aria-labelledby="map-canvas-heading">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2
                  id="map-canvas-heading"
                  className="text-lg font-semibold text-gray-900"
                >
                  Approximate Coordinate Map ({markers.length} pinned)
                </h2>

                {unmappedCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {unmappedCount} unpinned{' '}
                    {unmappedCount === 1 ? 'report' : 'reports'} listed
                    alongside
                  </span>
                )}
              </div>

              {markers.length === 0 ? (
                <div
                  className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center"
                  role="status"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    No reports with coordinates yet
                  </p>

                  <p className="mt-1 max-w-md text-sm text-gray-600">
                    Active reports currently have no usable coordinates.
                    Select a report from the accessible list to inspect its
                    public summary.
                  </p>
                </div>
              ) : (
                <div
                  className="relative h-80 w-full overflow-hidden rounded-lg border border-civic-200 bg-civic-50/50"
                  role="region"
                  aria-label="Approximate civic issue coordinate plot"
                >
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full text-civic-200/70"
                    aria-hidden="true"
                  >
                    <defs>
                      <pattern
                        id="civic-map-grid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                      </pattern>
                    </defs>

                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#civic-map-grid)"
                    />
                  </svg>

                  {markers.map(
                    ({ report, lat, lng, xPercent, yPercent }) => {
                      const isSelected = report.id === selectedId

                      return (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => {
                            setSelectedId(report.id)
                          }}
                          style={{
                            left: `${xPercent}%`,
                            top: `${yPercent}%`,
                          }}
                          aria-pressed={isSelected}
                          aria-label={`Select approximate marker: ${getCategoryLabel(report.category)} report`}
                          title={`Approximate coordinates: ${lat.toFixed(2)}, ${lng.toFixed(2)}`}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-2.5 py-1 text-xs font-semibold shadow-sm transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-600 ${isSelected
                              ? 'z-20 scale-110 border-white bg-civic-700 text-white ring-2 ring-civic-500'
                              : 'z-10 border-civic-700 bg-white text-civic-800 hover:bg-civic-100'
                            }`}
                        >
                          📍
                        </button>
                      )
                    },
                  )}
                </div>
              )}
            </section>

            {selectedReport && (
              <section
                className="card"
                aria-labelledby="selected-report-heading"
                aria-live="polite"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2
                    id="selected-report-heading"
                    className="text-lg font-semibold text-gray-900"
                  >
                    {selectedReport.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedReport.status} />
                    <PriorityBadge priority={selectedReport.priority} />
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-gray-700">Category</dt>
                    <dd>{getCategoryLabel(selectedReport.category)}</dd>
                  </div>

                  <div>
                    <dt className="font-medium text-gray-700">Location</dt>
                    <dd>Approximate area only</dd>
                  </div>

                  <div>
                    <dt className="font-medium text-gray-700">Submitted</dt>
                    <dd>
                      <time dateTime={selectedReport.created_at}>
                        {formatReportDate(selectedReport.created_at)}
                      </time>
                    </dd>
                  </div>

                  <div>
                    <dt className="font-medium text-gray-700">
                      Approximate coordinates
                    </dt>
                    <dd>
                      {selectedCoords
                        ? `${selectedCoords.lat.toFixed(2)}, ${selectedCoords.lng.toFixed(2)}`
                        : 'Not available'}
                    </dd>
                  </div>
                </dl>
              </section>
            )}
          </div>

          <aside
            className="card"
            aria-labelledby="public-report-list-heading"
          >
            <h2
              id="public-report-list-heading"
              className="mb-4 text-lg font-semibold text-gray-900"
            >
              Active Reports ({reports.length})
            </h2>

            <ul
              className="max-h-[32rem] space-y-2 overflow-y-auto pr-1"
              aria-label="Accessible list of active public reports"
            >
              {reports.map((report) => {
                const isSelected = report.id === selectedId
                const hasCoords = parseCoordinates(report) !== null

                return (
                  <li key={report.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(report.id)
                      }}
                      aria-pressed={isSelected}
                      className={`w-full rounded-md border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-600 ${isSelected
                          ? 'border-civic-500 bg-civic-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-gray-900">
                          {report.title}
                        </span>

                        <StatusBadge status={report.status} />
                      </div>

                      <p className="mt-1 text-xs text-gray-600">
                        {getCategoryLabel(report.category)}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {hasCoords
                          ? 'Approximate area available'
                          : 'Location coordinates unavailable'}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      )}
    </div>
  )
}
