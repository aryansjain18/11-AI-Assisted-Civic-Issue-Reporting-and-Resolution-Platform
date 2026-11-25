
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { Session, User } from '@supabase/supabase-js'
import App from '../App'

const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignInWithPassword,
  mockSignUp,
  mockSignOut,
  mockFrom,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignOut: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
    from: mockFrom,
  },
}))

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    app_metadata: {},
    user_metadata: { display_name: 'Aryan Citizen' },
    aud: 'authenticated',
    created_at: '2026-11-25T00:00:00Z',
    email: 'citizen@example.com',
    ...overrides,
  }
}

function makeSession(user = makeUser()): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('Citizen authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

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

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                overrideTypes: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            })),
          })),
        })),
      }
    })
  })

  it('restores a persisted session on load and grants access to /reports/my', async () => {
    const session = makeSession()

    mockGetSession.mockResolvedValue({
      data: { session },
      error: null,
    })

    renderAt('/reports/my')

    expect(
      await screen.findByRole('heading', {
        name: /my reports/i,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('Aryan Citizen')).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument()
  })

  it('redirects unauthenticated users from /reports/my to /sign-in', async () => {
    renderAt('/reports/my')

    expect(
      await screen.findByRole('heading', {
        name: /sign in to civicfix/i,
      }),
    ).toBeInTheDocument()
  })

  it('validates sign-in fields before calling Supabase', async () => {
    const user = userEvent.setup()

    renderAt('/sign-in')

    const submitButton = await screen.findByRole('button', {
      name: /sign in/i,
    })

    await user.click(submitButton)

    expect(
      screen.getByText(/email address is required/i),
    ).toBeInTheDocument()

    expect(
      screen.getByText(/password is required/i),
    ).toBeInTheDocument()

    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('signs in a citizen and redirects to /reports/my', async () => {
    const user = userEvent.setup()
    const session = makeSession()

    mockSignInWithPassword.mockResolvedValue({
      data: { user: session.user, session },
      error: null,
    })

    renderAt('/sign-in')

    await user.type(
      await screen.findByLabelText(/email address/i),
      'citizen@example.com',
    )

    await user.type(
      screen.getByLabelText(/password/i),
      'strongpass123',
    )

    await user.click(
      screen.getByRole('button', { name: /sign in/i }),
    )

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'citizen@example.com',
        password: 'strongpass123',
      })
    })

    expect(
      await screen.findByRole('heading', {
        name: /my reports/i,
      }),
    ).toBeInTheDocument()
  })

  it('shows a safe error message when sign-in fails', async () => {
    const user = userEvent.setup()

    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    renderAt('/sign-in')

    await user.type(
      await screen.findByLabelText(/email address/i),
      'citizen@example.com',
    )

    await user.type(
      screen.getByLabelText(/password/i),
      'wrongpass',
    )

    await user.click(
      screen.getByRole('button', { name: /sign in/i }),
    )

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(/invalid email or password/i)
  })

  it('validates password length on sign-up', async () => {
    const user = userEvent.setup()

    renderAt('/sign-up')

    await user.type(
      await screen.findByLabelText(/email address/i),
      'new@example.com',
    )

    await user.type(
      screen.getByLabelText(/password/i),
      '123',
    )

    await user.click(
      screen.getByRole('button', { name: /create account/i }),
    )

    expect(
      screen.getByText(/password must be at least 6 characters long/i),
    ).toBeInTheDocument()

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('handles Supabase email confirmation required state on sign-up', async () => {
    const user = userEvent.setup()

    const newUser = makeUser({
      email: 'new@example.com',
    })

    mockSignUp.mockResolvedValue({
      data: { user: newUser, session: null },
      error: null,
    })

    renderAt('/sign-up')

    await user.type(
      await screen.findByLabelText(/display name/i),
      'New Citizen',
    )

    await user.type(
      screen.getByLabelText(/email address/i),
      'new@example.com',
    )

    await user.type(
      screen.getByLabelText(/password/i),
      'secret123',
    )

    await user.click(
      screen.getByRole('button', { name: /create account/i }),
    )

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'secret123',
        options: {
          data: {
            display_name: 'New Citizen',
          },
        },
      })
    })

    expect(
      await screen.findByText(/check your email inbox/i),
    ).toBeInTheDocument()
  })

  it('signs out an authenticated user and restores Sign In link', async () => {
    const user = userEvent.setup()
    const session = makeSession()

    mockGetSession.mockResolvedValue({
      data: { session },
      error: null,
    })

    mockSignOut.mockResolvedValue({
      error: null,
    })

    renderAt('/')

    const signOutBtn = await screen.findByRole('button', {
      name: /sign out/i,
    })

    await user.click(signOutBtn)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    expect(
      await screen.findByRole('link', {
        name: /sign in/i,
      }),
    ).toBeInTheDocument()
  })
})
