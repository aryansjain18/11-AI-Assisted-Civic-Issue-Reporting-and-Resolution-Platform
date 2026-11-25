
import type { AnalyticsSummary } from '../types'
import { supabase } from './supabase'

interface AnalyticsRpcResult {
  data: unknown
  error: unknown
}

function isAnalyticsSummary(value: unknown): value is AnalyticsSummary {
  if (!value || typeof value !== 'object') return false

  const data = value as Record<string, unknown>

  const isCountRecord = (record: unknown): boolean =>
    !!record &&
    typeof record === 'object' &&
    !Array.isArray(record) &&
    Object.values(record).every(
      (count) => typeof count === 'number' && Number.isInteger(count) && count >= 0,
    )

  return (
    typeof data.total === 'number' &&
    Number.isInteger(data.total) &&
    data.total >= 0 &&
    isCountRecord(data.by_status) &&
    isCountRecord(data.by_category) &&
    Array.isArray(data.daily_counts) &&
    data.daily_counts.every(
      (day) =>
        !!day &&
        typeof day === 'object' &&
        typeof (day as Record<string, unknown>).report_date === 'string' &&
        typeof (day as Record<string, unknown>).count === 'number' &&
        Number.isInteger((day as Record<string, unknown>).count) &&
        ((day as Record<string, unknown>).count as number) >= 0,
    )
  )
}

/**
 * Fetches aggregate analytics from the get_analytics_summary() RPC.
 * Returns only counts grouped by status, category, and day — no PII.
 */
export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const result = (await supabase.rpc(
    'get_analytics_summary',
  )) as unknown as AnalyticsRpcResult

  if (result.error) {
    throw new Error('Unable to load analytics right now. Please try again.')
  }

  if (!isAnalyticsSummary(result.data)) {
    throw new Error('The analytics service returned an invalid response.')
  }

  return result.data
}
