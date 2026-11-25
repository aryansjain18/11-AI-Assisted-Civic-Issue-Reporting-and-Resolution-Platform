import {
  CATEGORIES,
  type Category,
  type PublicReportSummary,
  type Report,
} from '../types'
import { supabase } from './supabase'

const REPORT_SELECT_COLUMNS =
  'id, reporter_id, title, description, category, location_text, location_lat, location_lng, status, priority, photo_path, ai_category_suggestion, deleted_at, created_at, updated_at'

interface PublicReportsRpcResult {
  data: unknown
  error: unknown
}

/**
 * Fetches only the authenticated citizen's active reports.
 * The explicit reporter_id filter complements database RLS.
 */
export async function fetchMyReports(userId: string): Promise<Report[]> {
  if (!userId) {
    throw new Error('You must be signed in to view your reports.')
  }

  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_SELECT_COLUMNS)
    .eq('reporter_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .overrideTypes<Report[], { merge: false }>()

  if (error) {
    console.error('Unable to fetch reports:', error)
    throw new Error(error.message || 'Unable to load your reports right now. Please try again.')
  }

  return data
}

/**
 * Fetches limited public report summaries through the database RPC.
 * The RPC excludes deleted and rejected reports and omits private fields.
 */
export async function fetchPublicReports(): Promise<PublicReportSummary[]> {
  const result = (await supabase.rpc(
    'get_public_reports',
  )) as unknown as PublicReportsRpcResult

  if (result.error) {
    throw new Error('Unable to load public reports right now. Please try again.')
  }

  return Array.isArray(result.data)
    ? (result.data as PublicReportSummary[])
    : []
}

/**
 * Returns the human-readable label for a report category.
 */
export function getCategoryLabel(category: Category): string {
  return CATEGORIES.find((item) => item.value === category)?.label ?? category
}

/**
 * Formats an ISO timestamp into a readable local date string.
 */
export function formatReportDate(isoDate: string): string {
  const parsed = new Date(isoDate)

  if (Number.isNaN(parsed.getTime())) {
    return isoDate
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}