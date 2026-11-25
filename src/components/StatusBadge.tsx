import type { Status } from '../types'
import { STATUSES } from '../types'

const statusStyles: Record<Status, string> = {
  submitted:    'badge-submitted',
  under_review: 'badge-review',
  in_progress:  'badge-progress',
  resolved:     'badge-resolved',
  rejected:     'badge-rejected',
}

interface StatusBadgeProps {
  status: Status
}

/**
 * Displays a report status as a coloured badge.
 * Uses both colour and label text so colour is not the sole indicator (accessibility).
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUSES.find((s) => s.value === status)?.label ?? status
  return (
    <span className={statusStyles[status]} aria-label={`Status: ${label}`}>
      {label}
    </span>
  )
}
