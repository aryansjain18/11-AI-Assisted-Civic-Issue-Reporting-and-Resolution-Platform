import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { Session, User } from '@supabase/supabase-js'
import App from '../App'
import type { Profile, Report, StatusEvent } from '../types'

const { mockGetSession, mockOnAuthStateChange, mockFrom, mockRpc } = vi.hoisted(
  () => ({
    mockGetSession: vi.fn(),
    mockOnAuthStateChange: vi.fn(),
    mockFrom: vi.fn(),
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
    from: mockFrom,
    rpc: mockRpc,
  },
}))

function makeUser(id = 'admin-1'): User {
  return {
    id,
    app_metadata: {},
    user_metadata: { display_name: 'City Admin' },
    aud: 'authenticated',
    created_at: '2026-11-25T00:00:00Z',
    email: 'admin@example.com',
  }
}

function makeSession(id = 'admin-1'): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: makeUser(id),
  }
}

function makeProfile(role: 'citizen' | 'admin'): Profile {
  return {
    id: role === 'admin' ? 'admin-1' : 'citizen-1',
    display_name: role === 'admin' ? 'City Admin' : 'Regular Citizen',
    role,
    created_at: '2026-11-25T00:00:00Z',
    updated_at: '2026-11-25T00:00:00Z',
  }
}

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'report-101',
    reporter_id: 'citizen-1',
    title: 'Collapsed drain cover near Elm Park',
    description: 'Storm drain grate is broken and poses a hazard to pedestrians.',
    category: 'drainage',
    location_text: 'Elm Park West Gate',
    location_lat: null,
    location_lng: null,
    status: 'submitted',
    priority: 'low',
    photo_path: null,
    ai_category_suggestion: null,
    deleted_at: null,
    created_at: '2026-11-24T08:00:00Z',
    updated_at: '2026-11-24T08:00:00Z',
    ...overrides,
  }
}

function makeStatusEvent(overrides: Partial<StatusEvent> = {}): StatusEvent {
  return {
    id: 'event-1',
    report_id: 'report-101',
    actor_id: 'admin-1',
    previous_status: 'submitted',
    new_status: 'under_review',
    note: 'Assigned to drainage inspection crew.',
    created_at: '2026-11-25T01:00:00Z',
    ...overrides,
  }
}

function setupSupabaseMocks({
  role = 'admin',
  reports = [makeReport()],
  reportDetail = makeReport(),
  events = [],
  reportsError = null,
}: {
  role?: 'citizen' | 'admin'
  reports?: Report[]
  reportDetail?: Report | null
  events?: StatusEvent[]
  reportsError?: unknown
} = {}) {
  const profile = makeProfile(role)
  mockGetSession.mockResolvedValue({
    data: { session: makeSession(profile.id) },
    error: null,
  })

  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => ({
              overrideTypes: vi
                .fn()
                .mockResolvedValue({ data: profile, error: null }),
            })),
          })),
        })),
      }
    }

    if (table === 'reports') {
      return {
        select: vi.fn(() => ({
          is: vi.fn(() => ({
            order: vi.fn(() => ({
              overrideTypes: vi.fn().mockResolvedValue({
                data: reportsError ? null : reports,
                error: reportsError,
              }),
            })),
          })),
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              maybeSingle: vi.fn(() => ({
                overrideTypes: vi.fn().mockResolvedValue({
                  data: reportDetail,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      }
    }

    if (table === 'status_events') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              overrideTypes: vi.fn().mockResolvedValue({
                data: events,
                error: null,
              }),
            })),
          })),
        })),
      }
    }

    return {}
  })
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('Admin workflow (M3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('redirects unauthenticated visitors from /admin to /sign-in', async () => {
    renderAt('/admin')

    expect(
      await screen.findByRole('heading', { name: /sign in to civicfix/i }),
    ).toBeInTheDocument()
  })

  it('blocks non-admin citizens from /admin with an access denied alert', async () => {
    setupSupabaseMocks({ role: 'citizen' })
    renderAt('/admin')

    expect(
      await screen.findByRole('heading', { name: /access denied/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/administrator privileges are required/i),
    ).toBeInTheDocument()
  })

  it('renders the admin dashboard queue for authenticated admins and supports filtering', async () => {
    const user = userEvent.setup()
    setupSupabaseMocks({
      role: 'admin',
      reports: [
        makeReport(),
        makeReport({
          id: 'report-102',
          title: 'Flickering streetlight on 2nd St',
          category: 'streetlight',
          status: 'resolved',
          priority: 'medium',
        }),
      ],
    })

    renderAt('/admin')

    expect(
      await screen.findByRole('heading', { name: /collapsed drain cover near elm park/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /flickering streetlight on 2nd st/i }),
    ).toBeInTheDocument()

    await user.selectOptions(
      screen.getByLabelText(/filter by status/i),
      'resolved',
    )

    expect(
      screen.queryByRole('heading', { name: /collapsed drain cover near elm park/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /flickering streetlight on 2nd st/i }),
    ).toBeInTheDocument()
  })

  it('shows an error state when loading admin reports fails', async () => {
    setupSupabaseMocks({
      role: 'admin',
      reportsError: { message: 'Permission denied' },
    })

    renderAt('/admin')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /unable to load reports/i,
    )
  })

  it('allows an admin to update priority and transition status with an audit note', async () => {
    const user = userEvent.setup()
    const initialReport = makeReport()
    const prioritizedReport = makeReport({ priority: 'high' })
    const reviewedReport = makeReport({
      priority: 'high',
      status: 'under_review',
    })
    const recordedEvent = makeStatusEvent()

    setupSupabaseMocks({
      role: 'admin',
      reportDetail: initialReport,
      events: [],
    })

    mockRpc.mockImplementation((fnName: string) => {
      if (fnName === 'update_report_priority') {
        return {
          single: () => ({
            overrideTypes: vi.fn().mockResolvedValue({
              data: prioritizedReport,
              error: null,
            }),
          }),
        }
      }
      if (fnName === 'update_report_status') {
        // After status update, status_events query should return the new event
        setupSupabaseMocks({
          role: 'admin',
          reportDetail: reviewedReport,
          events: [recordedEvent],
        })
        return {
          single: () => ({
            overrideTypes: vi.fn().mockResolvedValue({
              data: reviewedReport,
              error: null,
            }),
          }),
        }
      }
      return {
        single: () => ({
          overrideTypes: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }
    })

    renderAt('/admin/reports/report-101')

    expect(
      await screen.findByRole('heading', { name: /collapsed drain cover near elm park/i }),
    ).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/priority level/i), 'high')
    await user.click(screen.getByRole('button', { name: /update priority/i }))

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('update_report_priority', {
        p_report_id: 'report-101',
        p_new_priority: 'high',
      })
    })
    expect(await screen.findByText(/priority updated\./i)).toBeInTheDocument()

    await user.type(
      screen.getByLabelText(/resolution note/i),
      'Assigned to drainage inspection crew.',
    )
    await user.click(screen.getByRole('button', { name: /update status/i }))

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('update_report_status', {
        p_report_id: 'report-101',
        p_new_status: 'under_review',
        p_note: 'Assigned to drainage inspection crew.',
      })
    })
    expect(
      await screen.findByText(/status updated to under review\./i),
    ).toBeInTheDocument()
    expect(
      await screen.findByText(/assigned to drainage inspection crew\./i),
    ).toBeInTheDocument()
  })

  it('disables status transitions when a report is in a terminal state', async () => {
    setupSupabaseMocks({
      role: 'admin',
      reportDetail: makeReport({ status: 'resolved' }),
      events: [makeStatusEvent({ previous_status: 'in_progress', new_status: 'resolved' })],
    })

    renderAt('/admin/reports/report-101')

    expect(
      await screen.findByText(/cannot transition further/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /update status/i }),
    ).not.toBeInTheDocument()
  })

  it('blocks non-admin citizens from /admin/reports/:id and hides Admin nav links', async () => {
    setupSupabaseMocks({ role: 'citizen' })
    renderAt('/admin/reports/report-101')

    expect(
      await screen.findByRole('heading', { name: /access denied/i }),
    ).toBeInTheDocument()
    const primaryNav = screen.getByRole('navigation', {
      name: /primary navigation/i,
    })
    const mobileNav = screen.getByRole('navigation', {
      name: /mobile navigation/i,
    })
    expect(
      within(primaryNav).queryByRole('link', { name: /^admin$/i }),
    ).not.toBeInTheDocument()
    expect(
      within(mobileNav).queryByRole('link', { name: /^admin$/i }),
    ).not.toBeInTheDocument()
  })

  it('shows an alert when update_report_status RPC rejects an update', async () => {
    const user = userEvent.setup()
    setupSupabaseMocks({
      role: 'admin',
      reportDetail: makeReport(),
      events: [],
    })

    mockRpc.mockImplementation(() => ({
      single: () => ({
        overrideTypes: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Invalid status transition' },
        }),
      }),
    }))

    renderAt('/admin/reports/report-101')

    expect(
      await screen.findByRole('heading', {
        name: /collapsed drain cover near elm park/i,
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /update status/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /invalid status transition/i,
    )
  })
})
