/** Report category options */
export const CATEGORIES = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'garbage', label: 'Garbage / Waste' },
  { value: 'water_leak', label: 'Water Leak' },
  { value: 'streetlight', label: 'Streetlight' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'other', label: 'Other' },
] as const

export type Category = (typeof CATEGORIES)[number]['value']

/** Report status options */
export const STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
] as const

export type Status = (typeof STATUSES)[number]['value']

/** Priority options */
export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const

export type Priority = (typeof PRIORITIES)[number]['value']

/** User roles */
export type Role = 'citizen' | 'admin'

/** Minimal profile shape (populated after M2 auth) */
export interface Profile {
  id: string
  display_name: string | null
  role: Role
  created_at: string
  updated_at: string
}

/** Report as returned from the database */
export interface Report {
  id: string
  reporter_id: string
  title: string
  description: string
  category: Category
  location_text: string
  location_lat: number | null
  location_lng: number | null
  status: Status
  priority: Priority
  photo_path: string | null
  ai_category_suggestion: Category | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

/** Status event as returned from the database (audit log) */
export interface StatusEvent {
  id: string
  report_id: string
  actor_id: string
  previous_status: Status | null
  new_status: Status
  note: string | null
  created_at: string
}

/** Non-PII public summary (from get_public_reports() RPC) */
export interface PublicReportSummary {
  id: string
  title: string
  category: Category
  status: Status
  priority: Priority
  location_text: string
  location_lat: number | null
  location_lng: number | null
  created_at: string
}

/** Daily report count entry for the 30-day trend */
export interface DailyCount {
  report_date: string
  count: number
}

/** Aggregate analytics from get_analytics_summary() RPC — no PII */
export interface AnalyticsSummary {
  total: number
  by_status: Record<string, number | undefined>
  by_category: Record<string, number | undefined>
  daily_counts: DailyCount[]
}

/** Reasons AI classification may be unavailable */
export type ClassificationUnavailableReason =
  | 'invalid_input'
  | 'not_configured'
  | 'rate_limited'
  | 'timeout'
  | 'invalid_response'
  | 'error'

/** Result from the optional AI category suggestion adapter */
export type ClassificationResult =
  | {
      status: 'suggested'
      category: Category
      provider: 'gemini'
    }
  | {
      status: 'unavailable'
      reason: ClassificationUnavailableReason
      message: string
    }
