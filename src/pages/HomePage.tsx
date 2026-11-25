import { Link } from 'react-router-dom'
import { CATEGORIES } from '../types'

const features = [
  {
    title: 'Report an Issue',
    description:
      'Submit civic problems—potholes, garbage, water leaks, streetlights, and more—with location and optional photos.',
    icon: '📍',
    link: '/reports/new',
    cta: 'Report now',
  },
  {
    title: 'Track Progress',
    description:
      'Follow your reports from submission through resolution. Get clear status updates at every stage.',
    icon: '📊',
    link: '/reports/my',
    cta: 'My reports',
  },
  {
    title: 'Community Map',
    description:
      'See open issues in your area and understand where infrastructure attention is most needed.',
    icon: '🗺️',
    link: '/map',
    cta: 'View map',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section
        className="bg-gradient-to-br from-civic-700 to-civic-900 py-20 text-white"
        aria-labelledby="hero-heading"
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 id="hero-heading" className="mb-4 text-4xl font-bold sm:text-5xl">
            Fix your city, together.
          </h1>
          <p className="mb-8 text-lg text-civic-100 sm:text-xl">
            CivicFix helps communities report local infrastructure and
            sanitation issues, track their resolution, and hold services
            accountable.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/reports/new"
              className="btn-primary px-6 py-3 text-base"
            >
              Report an issue
            </Link>
            <Link
              to="/map"
              className="btn bg-civic-600/40 text-white hover:bg-civic-600/60 px-6 py-3 text-base border border-civic-400"
            >
              View community map
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        className="py-16"
        aria-labelledby="features-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="features-heading"
            className="mb-12 text-center text-2xl font-semibold text-gray-900"
          >
            How CivicFix works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="card text-center">
                <div
                  className="mb-4 text-4xl"
                  aria-hidden="true"
                  role="img"
                >
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {f.title}
                </h3>
                <p className="mb-4 text-sm text-gray-600">{f.description}</p>
                <Link to={f.link} className="btn-secondary text-sm">
                  {f.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Issue categories */}
      <section
        className="bg-gray-50 py-14"
        aria-labelledby="categories-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            id="categories-heading"
            className="mb-8 text-center text-xl font-semibold text-gray-900"
          >
            What can you report?
          </h2>
          <ul
            className="flex flex-wrap justify-center gap-3"
            role="list"
            aria-label="Reportable issue categories"
          >
            {CATEGORIES.map((cat) => (
              <li key={cat.value}>
                <span className="badge bg-civic-50 text-civic-700 border border-civic-200 px-3 py-1 text-sm">
                  {cat.label}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Link to="/reports/new" className="btn-primary">
              Get started — report an issue
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
