import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('Routing', () => {
  it('renders the home page at /', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('heading', { name: /fix your city/i }),
    ).toBeInTheDocument()
  })

  it('renders the new report page at /reports/new', async () => {
    renderAt('/reports/new')
    expect(
      await screen.findByRole('heading', { name: /report an issue/i }),
    ).toBeInTheDocument()
  })

  it('redirects unauthenticated visitors from /reports/my to /sign-in', async () => {
    renderAt('/reports/my')
    expect(
      await screen.findByRole('heading', { name: /sign in to civicfix/i }),
    ).toBeInTheDocument()
  })

  it('renders the public map page at /map', async () => {
    renderAt('/map')
    expect(
      await screen.findByRole('heading', { name: /community issue map/i }),
    ).toBeInTheDocument()
  })

  it('renders the analytics page at /analytics', async () => {
    renderAt('/analytics')
    expect(
      await screen.findByRole('heading', { name: /analytics/i }),
    ).toBeInTheDocument()
  })

  it('redirects unauthenticated visitors from /admin to /sign-in', async () => {
    renderAt('/admin')
    expect(
      await screen.findByRole('heading', { name: /sign in to civicfix/i }),
    ).toBeInTheDocument()
  })

  it('renders the sign-in page at /sign-in', async () => {
    renderAt('/sign-in')
    expect(
      await screen.findByRole('heading', { name: /sign in/i }),
    ).toBeInTheDocument()
  })

  it('renders the sign-up page at /sign-up', async () => {
    renderAt('/sign-up')
    expect(
      await screen.findByRole('heading', { name: /create your account/i }),
    ).toBeInTheDocument()
  })

  it('renders the 404 page for unknown routes', async () => {
    renderAt('/does-not-exist')
    expect(
      await screen.findByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
  })
})
