import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'
import type { Status, Priority } from '../types'

describe('StatusBadge', () => {
  const statuses: Status[] = [
    'submitted',
    'under_review',
    'in_progress',
    'resolved',
    'rejected',
  ]

  it.each(statuses)('renders "%s" status with accessible label', (status) => {
    render(<StatusBadge status={status} />)
    const badge = screen.getByLabelText(new RegExp(`status:`, 'i'))
    expect(badge).toBeInTheDocument()
  })

  it('renders "Submitted" label for submitted status', () => {
    render(<StatusBadge status="submitted" />)
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })

  it('renders "Under Review" label for under_review status', () => {
    render(<StatusBadge status="under_review" />)
    expect(screen.getByText('Under Review')).toBeInTheDocument()
  })

  it('renders "Resolved" label for resolved status', () => {
    render(<StatusBadge status="resolved" />)
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })
})

describe('PriorityBadge', () => {
  const priorities: Priority[] = ['low', 'medium', 'high']

  it.each(priorities)('renders "%s" priority', (priority) => {
    render(<PriorityBadge priority={priority} />)
    const badge = screen.getByLabelText(new RegExp(`${priority} priority`, 'i'))
    expect(badge).toBeInTheDocument()
  })
})
