import type { Priority } from '../types'

const priorityStyles: Record<Priority, string> = {
  low:    'badge bg-gray-100 text-gray-600',
  medium: 'badge bg-warning-50 text-warning-700',
  high:   'badge bg-danger-50 text-danger-700',
}

const priorityLabels: Record<Priority, string> = {
  low: 'Low priority',
  medium: 'Medium priority',
  high: 'High priority',
}

interface PriorityBadgeProps {
  priority: Priority
}

/**
 * Displays report priority as a coloured badge.
 * aria-label provides context so colour is not the sole indicator.
 */
export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={priorityStyles[priority]} aria-label={priorityLabels[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}
