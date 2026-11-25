
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { Session, User } from '@supabase/supabase-js'
import App from '../App'
import type { Report } from '../types'

const { mockGetSession, mockOnAuthStateChange, mockFrom } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockFrom: vi.fn(),
}))

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
  },
}))

function makeUser(): User {
  return {
    id: 'user-123',
    app_metadata: {},
    user_metadata: { display_name: 'Aryan Citizen' },
    aud: 'authenticated',
    created_at: '2026-11-25T00:00:00Z',
    email: 'citizen@example.com',
  }
}

function makeSession(): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: makeUser(),
  }
}

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 'report-1',
    reporter_id: 'user-123',
    title: 'Large pothole on Main Street',
    description: 'Deep pothole near the central bus stop causing traffic delays.',
    category: 'pothole',
    location_text: 'Main Street & 4th Ave',
    location_lat: null,
    location_lng: null,
    status: 'under_review',
    priority: 'high',
    photo_path: null,
    ai_category_suggestion: null,
    deleted_at: null,
    created_at: '2026-11-24T10:30:00Z',
    updated_at: '2026-11-24T10:30:00Z',
    ...overrides,
  }
}

function mockReportsQuery(result: {
  data: Report[] | null
  error: unknown
}) {
  const overrideTypes = vi.fn().mockResolvedValue(result)
  const order = vi.fn().mockReturnValue({ overrideTypes })
  const is = vi.fn().mockReturnValue({ order })
  const eq = vi.fn().mockReturnValue({ is })
  const select = vi.fn().mockReturnValue({ eq })

  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => ({
              overrideTypes: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            })),
          })),
        })),
      }
    }

    return { select }
  })

  return { select, eq, is, order, overrideTypes }
}

function renderMyReports() {
  return render(
    <MemoryRouter initialEntries={['/reports/my']}>
      <App />
    </MemoryRouter>,
  )
}

describe('MyReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetSession.mockResolvedValue({
      data: { session: makeSession() },
      error: null,
    })

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('redirects unauthenticated users to /sign-in', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    renderMyReports()

    expect(
      await screen.findByRole('heading', {
        name: /sign in to civicfix/i,
      }),
    ).toBeInTheDocument()

    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('shows a loading state while reports are being fetched', async () => {
    const overrideTypes = vi.fn().mockImplementation(
      () => new Promise(() => undefined),
    )

    const order = vi.fn().mockReturnValue({ overrideTypes })
    const is = vi.fn().mockReturnValue({ order })
    const eq = vi.fn().mockReturnValue({ is })
    const select = vi.fn().mockReturnValue({ eq })

    mockFrom.mockReturnValue({ select })

    renderMyReports()

    expect(
      await screen.findByText(
        /checking your account and loading reports/i,
      ),
    ).toBeInTheDocument()
  })

  it('displays retrieved reports with title, category, location, date, status, and priority', async () => {
    const query = mockReportsQuery({
      data: [makeReport()],
      error: null,
    })

    renderMyReports()

    expect(
      await screen.findByRole('heading', {
        name: /large pothole on main street/i,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('Pothole')).toBeInTheDocument()
    expect(screen.getByText('Main Street & 4th Ave')).toBeInTheDocument()
    expect(screen.getByText('Under Review')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText(/Nov 24, 2026/i)).toBeInTheDocument()

    expect(query.eq).toHaveBeenCalledWith('reporter_id', 'user-123')
  })

  it('displays an empty state with a link to report a new issue when there are no reports', async () => {
    mockReportsQuery({
      data: [],
      error: null,
    })

    renderMyReports()

    expect(
      await screen.findByRole('heading', {
        name: /no reports yet/i,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: /report your first issue/i,
      }),
    ).toHaveAttribute('href', '/reports/new')
  })

  it('displays an error state when loading fails and allows retrying', async () => {
    const user = userEvent.setup()

    const overrideTypes = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'DB error' },
      })
      .mockResolvedValueOnce({
        data: [makeReport()],
        error: null,
      })

    const order = vi.fn().mockReturnValue({ overrideTypes })
    const is = vi.fn().mockReturnValue({ order })
    const eq = vi.fn().mockReturnValue({ is })
    const select = vi.fn().mockReturnValue({ eq })

    mockFrom.mockReturnValue({ select })

    renderMyReports()

    const alert = await screen.findByRole('alert')

    expect(alert).toHaveTextContent(/DB error/i)

    await user.click(
      screen.getByRole('button', { name: /try again/i }),
    )

    expect(
      await screen.findByRole('heading', {
        name: /large pothole on main street/i,
      }),
    ).toBeInTheDocument()

    expect(overrideTypes).toHaveBeenCalledTimes(2)
  })

  it('refreshes reports when the Refresh button is clicked', async () => {
    const user = userEvent.setup()

    const overrideTypes = vi
      .fn()
      .mockResolvedValueOnce({
        data: [],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          makeReport({
            title: 'Broken streetlight on Oak Rd',
          }),
        ],
        error: null,
      })

    const order = vi.fn().mockReturnValue({ overrideTypes })
    const is = vi.fn().mockReturnValue({ order })
    const eq = vi.fn().mockReturnValue({ is })
    const select = vi.fn().mockReturnValue({ eq })

    mockFrom.mockReturnValue({ select })

    renderMyReports()

    expect(
      await screen.findByRole('heading', {
        name: /no reports yet/i,
      }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: /refresh my reports/i,
      }),
    )

    await waitFor(() => {
      expect(overrideTypes).toHaveBeenCalledTimes(2)
    })

    expect(
      await screen.findByRole('heading', {
        name: /broken streetlight on oak rd/i,
      }),
    ).toBeInTheDocument()
  })
})
