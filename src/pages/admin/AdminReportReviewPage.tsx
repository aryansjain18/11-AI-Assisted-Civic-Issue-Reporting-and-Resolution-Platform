import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import PriorityBadge from '../../components/PriorityBadge'
import StatusBadge from '../../components/StatusBadge'
import {
  ALLOWED_STATUS_TRANSITIONS,
  fetchAdminReportById,
  fetchReportStatusEvents,
  updateReportPriority,
  updateReportStatus,
} from '../../lib/admin'
import { formatReportDate, getCategoryLabel } from '../../lib/reports'
import {
  PRIORITIES,
  STATUSES,
  type Priority,
  type Report,
  type Status,
  type StatusEvent,
} from '../../types'

function getStatusLabel(status: Status): string {
  return STATUSES.find((s) => s.value === status)?.label ?? status
}

/**
 * Administrator report review page for updating priority, transitioning status,
 * recording optional notes, and viewing the status_events audit timeline.
 */
export default function AdminReportReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<Report | null>(null)
  const [events, setEvents] = useState<StatusEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedPriority, setSelectedPriority] = useState<Priority>('low')
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const [priorityMessage, setPriorityMessage] = useState<string | null>(null)
  const [priorityError, setPriorityError] = useState<string | null>(null)

  const [selectedStatus, setSelectedStatus] = useState<Status | ''>('')
  const [note, setNote] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const loadDetails = useCallback(async () => {
    if (!id) {
      setLoadError('Report identifier is missing.')
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const [reportData, eventsData] = await Promise.all([
        fetchAdminReportById(id),
        fetchReportStatusEvents(id),
      ])

      if (!reportData) {
        setReport(null)
        setEvents([])
        setLoadError('Report not found or no longer active.')
      } else {
        setReport(reportData)
        setEvents(eventsData)
        setSelectedPriority(reportData.priority)
        const nextAllowed = ALLOWED_STATUS_TRANSITIONS[reportData.status]
        setSelectedStatus(nextAllowed[0] ?? '')
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load report details.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadDetails()
  }, [loadDetails])

  async function handlePrioritySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!report) return

    setPriorityMessage(null)
    setPriorityError(null)
    setUpdatingPriority(true)

    try {
      const updated = await updateReportPriority(report.id, selectedPriority)
      setReport(updated)
      setSelectedPriority(updated.priority)
      setPriorityMessage('Priority updated.')
    } catch (err) {
      setPriorityError(
        err instanceof Error ? err.message : 'Unable to update priority.',
      )
    } finally {
      setUpdatingPriority(false)
    }
  }

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!report || !selectedStatus) return

    setStatusMessage(null)
    setStatusError(null)
    setUpdatingStatus(true)

    try {
      const updated = await updateReportStatus(report.id, selectedStatus, note)
      const updatedEvents = await fetchReportStatusEvents(report.id)
      setReport(updated)
      setEvents(updatedEvents)
      setNote('')
      const nextAllowed = ALLOWED_STATUS_TRANSITIONS[updated.status]
      setSelectedStatus(nextAllowed[0] ?? '')
      setStatusMessage(
        `Status updated to ${getStatusLabel(updated.status)}.`,
      )
    } catch (err) {
      setStatusError(
        err instanceof Error ? err.message : 'Unable to update report status.',
      )
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/admin"
          className="rounded text-sm text-civic-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500"
        >
          &larr; Back to Admin Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="card py-12 text-center" role="status" aria-live="polite">
          <p className="text-sm font-medium text-gray-600">
            Loading report details...
          </p>
        </div>
      ) : loadError || !report ? (
        <div
          className="card border-danger-500/30 bg-danger-50 text-center"
          role="alert"
        >
          <p className="text-sm font-medium text-danger-700">
            {loadError ?? 'Report not found.'}
          </p>
          <button
            type="button"
            onClick={() => {
              void loadDetails()
            }}
            className="btn-secondary mt-4"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Report Overview */}
          <article className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {report.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Report ID: <code className="text-xs">{report.id}</code>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={report.status} />
                <PriorityBadge priority={report.priority} />
              </div>
            </div>

            <p className="mt-4 whitespace-pre-line text-sm text-gray-700">
              {report.description}
            </p>

            <dl className="mt-6 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600 sm:grid-cols-3">
              <div>
                <dt className="font-medium text-gray-700">Category</dt>
                <dd>{getCategoryLabel(report.category)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Location</dt>
                <dd>{report.location_text}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Submitted</dt>
                <dd>
                  <time dateTime={report.created_at}>
                    {formatReportDate(report.created_at)}
                  </time>
                </dd>
              </div>
            </dl>
          </article>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Priority Update */}
            <section className="card" aria-labelledby="priority-heading">
              <h2
                id="priority-heading"
                className="mb-4 text-lg font-semibold text-gray-900"
              >
                Update Priority
              </h2>

              {priorityError && (
                <div
                  className="mb-4 rounded-md border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-700"
                  role="alert"
                >
                  {priorityError}
                </div>
              )}

              {priorityMessage && (
                <div
                  className="mb-4 rounded-md border border-success-500/30 bg-success-50 px-3 py-2 text-sm text-success-700"
                  role="status"
                >
                  {priorityMessage}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  void handlePrioritySubmit(e)
                }}
              >
                <label htmlFor="report-priority" className="form-label">
                  Priority level
                </label>
                <select
                  id="report-priority"
                  value={selectedPriority}
                  onChange={(e) => {
                    setSelectedPriority(e.target.value as Priority)
                  }}
                  disabled={updatingPriority}
                  className="form-input mb-4"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={updatingPriority}
                  className="btn-secondary w-full"
                >
                  {updatingPriority ? 'Updating priority...' : 'Update priority'}
                </button>
              </form>
            </section>

            {/* Status Transition */}
            <section className="card" aria-labelledby="status-heading">
              <h2
                id="status-heading"
                className="mb-4 text-lg font-semibold text-gray-900"
              >
                Update Status
              </h2>

              {statusError && (
                <div
                  className="mb-4 rounded-md border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-700"
                  role="alert"
                >
                  {statusError}
                </div>
              )}

              {statusMessage && (
                <div
                  className="mb-4 rounded-md border border-success-500/30 bg-success-50 px-3 py-2 text-sm text-success-700"
                  role="status"
                >
                  {statusMessage}
                </div>
              )}

              {ALLOWED_STATUS_TRANSITIONS[report.status].length === 0 ? (
                <p className="text-sm text-gray-600" role="note">
                  This report is in a terminal status (
                  <strong>{getStatusLabel(report.status)}</strong>) and cannot
                  transition further.
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    void handleStatusSubmit(e)
                  }}
                >
                  <div className="mb-4">
                    <label htmlFor="next-status" className="form-label">
                      Next status
                    </label>
                    <select
                      id="next-status"
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value as Status)
                      }}
                      disabled={updatingStatus}
                      className="form-input"
                    >
                      {ALLOWED_STATUS_TRANSITIONS[report.status].map(
                        (nextStatus) => (
                          <option key={nextStatus} value={nextStatus}>
                            {getStatusLabel(nextStatus)}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="status-note" className="form-label">
                      Resolution note <span className="text-gray-500">(optional)</span>
                    </label>
                    <textarea
                      id="status-note"
                      rows={3}
                      maxLength={500}
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value)
                      }}
                      disabled={updatingStatus}
                      placeholder="Add context for this status change..."
                      className="form-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingStatus || !selectedStatus}
                    className="btn-primary w-full"
                  >
                    {updatingStatus ? 'Updating status...' : 'Update status'}
                  </button>
                </form>
              )}
            </section>
          </div>

          {/* Status History */}
          <section className="card" aria-labelledby="history-heading">
            <h2
              id="history-heading"
              className="mb-4 text-lg font-semibold text-gray-900"
            >
              Status History
            </h2>

            {events.length === 0 ? (
              <p className="text-sm text-gray-600">
                No status changes have been recorded yet.
              </p>
            ) : (
              <ol className="space-y-4" aria-label="Status change timeline">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="border-l-2 border-civic-200 pl-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {ev.previous_status && (
                        <>
                          <StatusBadge status={ev.previous_status} />
                          <span aria-hidden="true">&rarr;</span>
                        </>
                      )}
                      <StatusBadge status={ev.new_status} />
                      <time
                        dateTime={ev.created_at}
                        className="text-xs text-gray-500"
                      >
                        {formatReportDate(ev.created_at)}
                      </time>
                    </div>
                    {ev.note && (
                      <p className="mt-1 text-sm text-gray-700">{ev.note}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
