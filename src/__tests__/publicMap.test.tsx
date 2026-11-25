
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import type { PublicReportSummary } from '../types'

const { mockGetSession, mockOnAuthStateChange, mockRpc } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockRpc: vi.fn(),
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
    rpc: mockRpc,
  },
}))

function makePublicReport(
  overrides: Partial<PublicReportSummary> = {},
): PublicReportSummary {
  return {
    id: 'pub-1',
    title: 'Flooded intersection on 5th Ave',
    category: 'drainage',
    status: 'under_review',
    priority: 'high',
    location_text: 'Approximate area',
    location_lat: 37.7749,
    location_lng: -122.4194,
    created_at: '2026-11-24T12:00:00Z',
    ...overrides,
  }
}

function renderMap() {
  return render(
    <MemoryRouter initialEntries={['/map']}>
      <App />
    </MemoryRouter>,
  )
}

describe('PublicMapPage (M4.1)', () => {
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

  it('shows a loading state while public reports are fetched', async () => {
    mockRpc.mockImplementation(() => new Promise(() => undefined))

    renderMap()

    expect(
      await screen.findByText(/loading public reports/i),
    ).toBeInTheDocument()
  })

  it('shows an error state and retries when fetching public reports fails', async () => {
    const user = userEvent.setup()

    mockRpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC failed' },
      })
      .mockResolvedValueOnce({
        data: [makePublicReport()],
        error: null,
      })

    renderMap()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /unable to load public reports/i,
    )

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(
      await screen.findByRole('heading', {
        name: /flooded intersection on 5th ave/i,
      }),
    ).toBeInTheDocument()
  })

  it('shows an empty state when there are no active public reports', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })

    renderMap()

    expect(
      await screen.findByRole('heading', {
        name: /no active public reports yet/i,
      }),
    ).toBeInTheDocument()
  })

  it('handles reports without coordinates and keeps the report list accessible', async () => {
    mockRpc.mockResolvedValue({
      data: [
        makePublicReport({
          id: 'pub-text-only',
          title: 'Overflowing bin at Market Square',
          category: 'garbage',
          location_text: 'Approximate area',
          location_lat: null,
          location_lng: null,
        }),
      ],
      error: null,
    })

    renderMap()

    expect(
      await screen.findByText(/no reports with coordinates yet/i),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: /overflowing bin at market square/i,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(/location coordinates unavailable/i),
    ).toBeInTheDocument()

    expect(screen.getByText('Approximate area only')).toBeInTheDocument()
  })

  it('renders markers and updates details when selecting markers or list items', async () => {
    const user = userEvent.setup()

    const mapped1 = makePublicReport()

    const mapped2 = makePublicReport({
      id: 'pub-2',
      title: 'Broken streetlight near Library',
      category: 'streetlight',
      status: 'in_progress',
      priority: 'medium',
      location_text: 'Approximate area',
      location_lat: 37.781,
      location_lng: -122.411,
    })

    mockRpc.mockResolvedValue({
      data: [mapped1, mapped2],
      error: null,
    })

    renderMap()

    expect(
      await screen.findByText(/coordinate map \(2 pinned\)/i),
    ).toBeInTheDocument()

    const secondMarker = screen.getByRole('button', {
      name: /select approximate marker: streetlight report/i,
    })

    await user.click(secondMarker)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: /broken streetlight near library/i,
        }),
      ).toBeInTheDocument()
    })

    // Public details should not reveal the original free-text location.
    expect(screen.getByText('Approximate area only')).toBeInTheDocument()
    expect(screen.queryByText('Main Library Entrance')).not.toBeInTheDocument()

    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Medium').length).toBeGreaterThanOrEqual(1)

    // Select the first report using the accessible report-list alternative.
    const firstListButton = screen.getByRole('button', {
      name: /flooded intersection on 5th ave/i,
    })

    await user.click(firstListButton)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: /flooded intersection on 5th ave/i,
        }),
      ).toBeInTheDocument()
    })
  })
})
