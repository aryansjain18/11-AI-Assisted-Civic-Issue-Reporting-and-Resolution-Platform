import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import type { AnalyticsSummary } from '../types'

const { mockGetSession, mockOnAuthStateChange, mockRpc } = vi.hoisted(
  () => ({
    mockGetSession: vi.fn(),
    mockOnAuthStateChange: vi.fn(),
    mockRpc: vi.fn(),
  }),
)

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    rpc: mockRpc,
  },
}))

function makeSummary(
  overrides: Partial<AnalyticsSummary> = {},
): AnalyticsSummary {
  return {
    total: 42,
    by_status: {
      submitted: 20,
      under_review: 8,
      in_progress: 5,
      resolved: 7,
      rejected: 2,
    },
    by_category: {
      pothole: 15,
      garbage: 10,
      water_leak: 7,
      streetlight: 5,
      drainage: 3,
      other: 2,
    },
    daily_counts: [
      { report_date: '2026-11-20', count: 3 },
      { report_date: '2026-11-21', count: 5 },
      { report_date: '2026-11-22', count: 2 },
    ],
    ...overrides,
  }
}

function renderAnalytics() {
  return render(
    <MemoryRouter initialEntries={['/analytics']}>
      <App />
    </MemoryRouter>,
  )
}

describe('AnalyticsPage (M4.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('shows a loading state while analytics are fetched', async () => {
    mockRpc.mockImplementation(() => new Promise(() => undefined))

    renderAnalytics()

    expect(
      await screen.findByText(/loading analytics/i),
    ).toBeInTheDocument()
  })

  it('shows an error state with retry when the RPC fails', async () => {
    const user = userEvent.setup()
    mockRpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC failed' },
      })
      .mockResolvedValueOnce({ data: makeSummary(), error: null })

    renderAnalytics()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /unable to load analytics/i,
    )

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByText('42')).toBeInTheDocument()
  })

  it('shows an empty state when there are no reports', async () => {
    mockRpc.mockResolvedValue({
      data: {
        total: 0,
        by_status: {},
        by_category: {},
        daily_counts: [],
      },
      error: null,
    })

    renderAnalytics()

    expect(
      await screen.findByText(/no reports have been submitted yet/i),
    ).toBeInTheDocument()
  })

  it('renders summary statistics correctly', async () => {
    mockRpc.mockResolvedValue({ data: makeSummary(), error: null })

    renderAnalytics()

    // Wait for the dashboard data
    await screen.findByText('42')

    // Restrict summary assertions to the summary statistics section
    const summaryStats = screen.getByLabelText('Summary statistics')

    // Total Reports = 42
    expect(within(summaryStats).getByText('42')).toBeInTheDocument()

    // Open Issues = submitted(20) + under_review(8) + in_progress(5) = 33
    expect(within(summaryStats).getByText('33')).toBeInTheDocument()

    // Resolved = 7
    expect(
      within(summaryStats).getByLabelText('Resolved: 7'),
    ).toBeInTheDocument()

    // Rejected = 2
    expect(
      within(summaryStats).getByLabelText('Rejected: 2'),
    ).toBeInTheDocument()
  })

  it('renders status and category breakdowns', async () => {
    mockRpc.mockResolvedValue({ data: makeSummary(), error: null })

    renderAnalytics()

    await screen.findByText('42')

    // Status breakdown labels
    expect(
      screen.getByRole('heading', { name: /reports by status/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Submitted').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Resolved').length).toBeGreaterThanOrEqual(1)

    // Category breakdown labels
    expect(
      screen.getByRole('heading', { name: /reports by category/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Pothole').length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(/garbage/i).length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('renders the 30-day trend chart', async () => {
    mockRpc.mockResolvedValue({ data: makeSummary(), error: null })

    renderAnalytics()

    await screen.findByText('42')

    expect(
      screen.getByRole('heading', { name: /report trend/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: /bar chart showing report submissions/i,
      }),
    ).toBeInTheDocument()
  })

  it('does not expose reporter IDs, emails, or private data', async () => {
    mockRpc.mockResolvedValue({ data: makeSummary(), error: null })

    renderAnalytics()

    await screen.findByText('42')

    // The page must not render any PII-related content
    expect(screen.queryByText(/reporter/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/photo/i)).not.toBeInTheDocument()
  })
})
