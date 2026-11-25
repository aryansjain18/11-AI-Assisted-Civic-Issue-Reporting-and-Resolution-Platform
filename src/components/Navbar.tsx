import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navLinks = [
  { to: '/map', label: 'View Map' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/reports/my', label: 'My Reports' },
]

/**
 * Responsive top navigation bar with CivicFix branding and auth controls.
 * Uses NavLink for active-state styling and semantic nav/ul markup.
 */
export default function Navbar() {
  const { user, isAdmin, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const metadata = user?.user_metadata as { display_name?: unknown } | undefined
  const displayName =
    typeof metadata?.display_name === 'string' && metadata.display_name.trim()
      ? metadata.display_name.trim()
      : user?.email

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/')
    } catch {
      // Avoid unhandled rejection if signOut fails; user remains on current page.
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 rounded text-civic-700 hover:text-civic-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500"
          aria-label="CivicFix — go to home"
        >
          <CivicLogo />
          <span className="text-xl font-bold tracking-tight">CivicFix</span>
        </Link>

        {/* Primary navigation */}
        <nav aria-label="Primary navigation">
          <ul className="hidden items-center gap-1 sm:flex" role="list">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500 ${
                      isActive
                        ? 'bg-civic-50 text-civic-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
            {isAdmin && (
              <li>
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500 ${
                      isActive
                        ? 'bg-civic-50 text-civic-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  Admin
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          <Link to="/reports/new" className="btn-primary hidden sm:inline-flex">
            Report Issue
          </Link>
          {loading ? (
            <span className="px-2 text-xs text-gray-500" role="status">
              Loading...
            </span>
          ) : user ? (
            <div className="flex items-center gap-2">
              {displayName && (
                <span className="hidden max-w-36 truncate text-sm text-gray-700 md:inline">
                  {displayName}
                </span>
              )}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="btn-secondary text-sm"
              >
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          ) : (
            <Link to="/sign-in" className="btn-secondary text-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav (below header row) */}
      <nav
        className="border-t border-gray-100 sm:hidden"
        aria-label="Mobile navigation"
      >
        <ul className="flex justify-around px-2 py-1" role="list">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `block rounded px-3 py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500 ${
                    isActive ? 'text-civic-700' : 'text-gray-600'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink
              to="/reports/new"
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500 ${
                  isActive ? 'text-civic-700' : 'text-gray-600'
                }`
              }
            >
              Report
            </NavLink>
          </li>
          {isAdmin && (
            <li>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `block rounded px-3 py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500 ${
                    isActive ? 'text-civic-700' : 'text-gray-600'
                  }`
                }
              >
                Admin
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </header>
  )
}

function CivicLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="h-8 w-8"
    >
      <rect width="32" height="32" rx="8" fill="#0070bf" />
      <path
        d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm0 2a8 8 0 1 1 0 16A8 8 0 0 1 16 8zm0 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-1 5v6h2v-6h-2z"
        fill="white"
      />
    </svg>
  )
}
