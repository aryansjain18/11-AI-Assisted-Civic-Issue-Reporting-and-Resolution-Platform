import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">
            &copy; {year} CivicFix. Helping communities report and resolve civic
            issues.
          </p>
          <nav aria-label="Footer navigation">
            <ul className="flex gap-6" role="list">
              <li>
                <Link
                  to="/map"
                  className="text-sm text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500 rounded"
                >
                  View Map
                </Link>
              </li>
              <li>
                <Link
                  to="/analytics"
                  className="text-sm text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500 rounded"
                >
                  Analytics
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="text-sm text-gray-500 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500 rounded"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
