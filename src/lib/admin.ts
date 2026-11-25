import type { Priority, Report, Status, StatusEvent } from '../types'
import { supabase } from './supabase'

const REPORT_COLUMNS =
  'id, reporter_id, title, description, category, location_text, location_lat, location_lng, status, priority, photo_path, ai_category_suggestion, deleted_at, created_at, updated_at'

const STATUS_EVENT_COLUMNS =
  'id, report_id, actor_id, previous_status, new_status, note, created_at'

/**
 * Allowed status transitions matching the database update_report_status() RPC.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<Status, readonly Status[]> = {
  submitted: ['under_review', 'rejected'],
  under_review: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
}

/**
 * Fetches all active reports for administrators.
 * Authorization is enforced at the database layer via Supabase RLS.
 */
export async function fetchAllReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_COLUMNS)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .overrideTypes<Report[], { merge: false }>()

  if (error) {
    throw new Error('Unable to load reports. Verify administrator permissions and try again.')
  }

  return data
}

/**
 * Fetches a single active report by ID for administrative review.
 */
export async function fetchAdminReportById(reportId: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('id', reportId)
    .is('deleted_at', null)
    .maybeSingle()
    .overrideTypes<Report | null, { merge: false }>()

  if (error) {
    throw new Error('Unable to load the requested report.')
  }

  return data
}

/**
 * Fetches chronological status history events for a report.
 */
export async function fetchReportStatusEvents(
  reportId: string,
): Promise<StatusEvent[]> {
  const { data, error } = await supabase
    .from('status_events')
    .select(STATUS_EVENT_COLUMNS)
    .eq('report_id', reportId)
    .order('created_at', { ascending: true })
    .overrideTypes<StatusEvent[], { merge: false }>()

  if (error) {
    throw new Error('Unable to load status history for this report.')
  }

  return data
}

/**
 * Calls the atomic update_report_status PostgreSQL RPC.
 * Admin authorization and transition rules are enforced in the database.
 */
export async function updateReportStatus(
  reportId: string,
  newStatus: Status,
  note?: string,
): Promise<Report> {
  const trimmedNote = note?.trim()
  const { data, error } = await supabase
    .rpc('update_report_status', {
      p_report_id: reportId,
      p_new_status: newStatus,
      p_note: trimmedNote && trimmedNote.length > 0 ? trimmedNote : null,
    })
    .single()
    .overrideTypes<Report, { merge: false }>()

  if (error || !data) {
    throw new Error(error?.message || 'Unable to update report status.')
  }

  return data
}

/**
 * Calls the update_report_priority PostgreSQL RPC.
 * Admin authorization is enforced in the database.
 */
export async function updateReportPriority(
  reportId: string,
  newPriority: Priority,
): Promise<Report> {
  const { data, error } = await supabase
    .rpc('update_report_priority', {
      p_report_id: reportId,
      p_new_priority: newPriority,
    })
    .single()
    .overrideTypes<Report, { merge: false }>()

  if (error || !data) {
    throw new Error(error?.message || 'Unable to update report priority.')
  }

  return data
}
