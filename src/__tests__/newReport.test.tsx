import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

const {
  mockGetSession,
  mockOnAuthStateChange,
  mockFrom,
  mockInsert,
  mockInvoke,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockFrom: vi.fn(),
  mockInsert: vi.fn(),
  mockInvoke: vi.fn(),
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
    functions: {
      invoke: mockInvoke,
    },
  },
}))

const citizenSession = {
  user: {
    id: 'citizen-1',
    email: 'citizen@example.com',
  },
}

function renderNewReport() {
  return render(
    <MemoryRouter initialEntries={['/reports/new']}>
      <App />
    </MemoryRouter>,
  )
}

describe('NewReportPage with optional AI classification (M5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetSession.mockResolvedValue({
      data: { session: citizenSession },
      error: null,
    })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    id: 'citizen-1',
                    display_name: 'Jane Citizen',
                    role: 'citizen',
                    created_at: '2026-11-24T00:00:00Z',
                    updated_at: '2026-11-24T00:00:00Z',
                  },
                  error: null,
                }),
            }),
          }),
        }
      }
      return {
        insert: mockInsert,
      }
    })

    mockInsert.mockResolvedValue({ error: null })
  })

  it('requests an AI suggestion, lets the citizen accept it without auto-submitting, and submits normally', async () => {
    const user = userEvent.setup()
    mockInvoke.mockResolvedValue({
      data: { status: 'suggested', category: 'water_leak' },
      error: null,
    })

    renderNewReport()

    const titleInput = await screen.findByLabelText(/^issue title$/i)
    const descInput = screen.getByLabelText(/^description$/i)
    const locationInput = screen.getByLabelText(/^location description$/i)

    await user.type(titleInput, 'Burst pipe on Elm Street')
    await user.type(
      descInput,
      'Water is flooding across the sidewalk near the corner hydrant.',
    )
    await user.type(locationInput, 'Elm Street & 4th')

    await user.click(
      screen.getByRole('button', { name: /suggest category with ai/i }),
    )

    expect(
      await screen.findByText(/ai suggestion: water leak/i),
    ).toBeInTheDocument()

    // Must not auto-submit
    expect(mockInsert).not.toHaveBeenCalled()

    // Verify no PII or coordinates were sent to AI
    expect(mockInvoke).toHaveBeenCalledWith('classify-report', {
      body: {
        title: 'Burst pipe on Elm Street',
        description:
          'Water is flooding across the sidewalk near the corner hydrant.',
      },
    })

    await user.click(
      screen.getByRole('button', { name: /accept suggestion/i }),
    )

    const waterLeakRadio = screen.getByRole('radio', { name: /water leak/i })
    expect(waterLeakRadio).toBeChecked()
    expect(mockInsert).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          reporter_id: 'citizen-1',
          category: 'water_leak',
          ai_category_suggestion: 'water_leak',
        }),
      )
    })

    expect(
      await screen.findByText(/your report was submitted successfully/i),
    ).toBeInTheDocument()
  })

  it('lets the citizen ignore an AI suggestion and keep their manual category', async () => {
    const user = userEvent.setup()
    mockInvoke.mockResolvedValue({
      data: { status: 'suggested', category: 'other' },
      error: null,
    })

    renderNewReport()

    await user.type(
      await screen.findByLabelText(/issue title/i),
      'Blocked gutter',
    )
    await user.type(
      screen.getByLabelText(/^description$/i),
      'Storm water is pooling in front of the school crosswalk.',
    )
    await user.click(screen.getByRole('radio', { name: /drainage/i }))

    await user.click(
      screen.getByRole('button', { name: /suggest category with ai/i }),
    )

    expect(await screen.findByText(/ai suggestion: other/i)).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /ignore suggestion/i }),
    )

    expect(screen.getByRole('radio', { name: /drainage/i })).toBeChecked()
    expect(screen.queryByText(/ai suggestion: other/i)).not.toBeInTheDocument()
  })

  it('allows normal manual report submission when AI is unavailable or unconfigured', async () => {
    const user = userEvent.setup()
    mockInvoke.mockResolvedValue({
      data: { status: 'unavailable', reason: 'not_configured' },
      error: null,
    })

    renderNewReport()

    await user.type(
      await screen.findByLabelText(/issue title/i),
      'Deep pothole on Main',
    )
    await user.type(
      screen.getByLabelText(/^description$/i),
      'Large pothole in the eastbound lane near the crosswalk.',
    )

    await user.click(
      screen.getByRole('button', { name: /suggest category with ai/i }),
    )

    expect(
      await screen.findByText(/ai category suggestion is currently disabled/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /pothole/i }))
    await user.type(
      screen.getByLabelText(/location description/i),
      'Main St & 1st Ave',
    )
    await user.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'pothole',
          ai_category_suggestion: null,
        }),
      )
    })
  })

  it('submits a report cleanly without ever invoking AI classification', async () => {
    const user = userEvent.setup()

    renderNewReport()

    await user.type(
      await screen.findByLabelText(/issue title/i),
      'Overflowing trash bin',
    )
    await user.type(
      screen.getByLabelText(/^description$/i),
      'The public waste bin by the transit stop has not been emptied.',
    )
    await user.click(screen.getByRole('radio', { name: /garbage/i }))
    await user.type(
      screen.getByLabelText(/location description/i),
      'Central Transit Stop',
    )

    await user.click(screen.getByRole('button', { name: /submit report/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'garbage',
          ai_category_suggestion: null,
        }),
      )
    })
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('shows an accessible validation message if AI suggestion is requested before entering enough text', async () => {
    const user = userEvent.setup()

    renderNewReport()

    await user.click(
      await screen.findByRole('button', { name: /suggest category with ai/i }),
    )

    expect(
      await screen.findByText(/enter an issue title \(5–120 characters\)/i),
    ).toBeInTheDocument()
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('rejects invalid description length on submit and never sends admin fields', async () => {
    const user = userEvent.setup()

    renderNewReport()

    await user.type(
      await screen.findByLabelText(/^issue title$/i),
      'Broken bench',
    )
    await user.type(
      screen.getByLabelText(/^description$/i),
      'Too short',
    )
    await user.click(screen.getByRole('radio', { name: /other/i }))
    await user.type(
      screen.getByLabelText(/^location description$/i),
      'City Park',
    )

    await user.click(screen.getByRole('button', { name: /submit report/i }))

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(/description must be between 20 and 2000 characters/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('shows an error alert when database insert fails and preserves form control', async () => {
    const user = userEvent.setup()
    mockInsert.mockResolvedValueOnce({
      error: new Error('Database write failed'),
    })

    renderNewReport()

    await user.type(
      await screen.findByLabelText(/^issue title$/i),
      'Water main leak on 3rd',
    )
    await user.type(
      screen.getByLabelText(/^description$/i),
      'Clean water is pooling along the curb on 3rd Avenue.',
    )
    await user.click(screen.getByRole('radio', { name: /water leak/i }))
    await user.type(
      screen.getByLabelText(/^location description$/i),
      '3rd Avenue North',
    )

    await user.click(screen.getByRole('button', { name: /submit report/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /database write failed/i,
    )

    const insertedPayload = mockInsert.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >
    expect(insertedPayload).not.toHaveProperty('status')
    expect(insertedPayload).not.toHaveProperty('priority')
    expect(insertedPayload).not.toHaveProperty('deleted_at')
  })

  it('disables report submission and prompts sign-in for unauthenticated visitors', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    renderNewReport()

    expect(
      await screen.findByText(/you must/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /submit report/i }),
    ).toBeDisabled()
  })
})
