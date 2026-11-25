import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-4 text-7xl font-bold text-gray-200" aria-hidden="true">
          404
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Page not found
        </h1>
        <p className="mb-6 text-gray-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    </div>
  )
}
