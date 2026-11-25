import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Protects routes that require an authenticated user.
 * Displays an accessible loading state while the session is being restored,
 * then redirects unauthenticated visitors to /sign-in preserving the target location.
 */
export default function AuthGuard() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        className="mx-auto flex max-w-4xl items-center justify-center px-4 py-16"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm text-gray-600">Checking authentication status...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  return <Outlet />
}
