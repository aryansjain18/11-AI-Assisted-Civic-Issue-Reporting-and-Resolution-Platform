import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Protects administrative routes in the UI.
 * Note: Database RLS and SECURITY DEFINER RPCs are the authoritative security boundary.
 */
export default function AdminGuard() {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        className="mx-auto flex max-w-4xl items-center justify-center px-4 py-16"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm text-gray-600">Verifying administrator access...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div
          className="card border-danger-500/30 bg-danger-50 text-center"
          role="alert"
        >
          <h1 className="text-xl font-bold text-danger-700">Access denied</h1>
          <p className="mt-2 text-sm text-danger-700">
            Administrator privileges are required to view this page.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/reports/my" className="btn-secondary">
              My Reports
            </Link>
            <Link to="/" className="btn-primary">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}
