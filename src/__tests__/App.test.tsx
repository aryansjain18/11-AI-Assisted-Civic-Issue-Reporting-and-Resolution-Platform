import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

async function renderApp(initialPath = '/') {
  const result = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  )
  await waitFor(() => {
    expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument()
  })
  return result
}

describe('App shell', () => {
  it('renders the CivicFix brand in the navbar', async () => {
    await renderApp()
    expect(screen.getByRole('link', { name: /civicfix/i })).toBeInTheDocument()
  })

  it('renders the skip-to-content link', async () => {
    await renderApp()
    expect(screen.getByText(/skip to main content/i)).toBeInTheDocument()
  })

  it('renders the primary navigation links', async () => {
    await renderApp()
    const mapLinks = screen.getAllByRole('link', { name: /view map/i })
    expect(mapLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the footer', async () => {
    await renderApp()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
