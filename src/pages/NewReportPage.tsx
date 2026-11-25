
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, type Category } from '../types'
import { useAuth } from '../hooks/useAuth'
import { classifyReportText } from '../lib/classify'
import { getCategoryLabel } from '../lib/reports'
import { supabase } from '../lib/supabase'

interface ReportCoordinates {
  latitude: number
  longitude: number
}

export default function NewReportPage() {
  const { user, loading } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<Category | null>(null)
  const [lastAiCategory, setLastAiCategory] = useState<Category | null>(null)
  const [aiAccepted, setAiAccepted] = useState(false)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [coordinates, setCoordinates] =
    useState<ReportCoordinates | null>(null)
  const [locationMessage, setLocationMessage] = useState('')

  const handleGetLocation = () => {
    setGettingLocation(true)
    setLocationMessage('')

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
          ) {
            setCoordinates(null)
            setLocationMessage(
              'Your device returned invalid coordinates. You can still submit without a location pin.',
            )
            setGettingLocation(false)
            return
          }

          setCoordinates({ latitude, longitude })
          setLocationMessage('Device location added to your report.')
          setGettingLocation(false)
        },
        (error) => {
          setCoordinates(null)

          if (error.code === error.PERMISSION_DENIED) {
            setLocationMessage(
              'Location permission was denied. You can still submit the report without coordinates.',
            )
          } else if (error.code === error.TIMEOUT) {
            setLocationMessage(
              'Location request timed out. Please try again or submit without coordinates.',
            )
          } else {
            setLocationMessage(
              'Could not get your device location. You can still submit without coordinates.',
            )
          }

          setGettingLocation(false)
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        },
      )
    } catch {
      setCoordinates(null)
      setLocationMessage(
        'Device location is unavailable in this browser. You can still submit without coordinates.',
      )
      setGettingLocation(false)
    }
  }

  const handleSuggestCategory = async () => {
    setAiLoading(true)
    setAiMessage(null)
    setAiSuggestion(null)
    setAiAccepted(false)

    const result = await classifyReportText({ title, description })

    if (result.status === 'suggested') {
      setAiSuggestion(result.category)
      setLastAiCategory(result.category)
      setAiMessage(null)
    } else {
      setAiMessage(result.message)
    }

    setAiLoading(false)
  }

  const handleAcceptSuggestion = () => {
    if (!aiSuggestion) return
    setSelectedCategory(aiSuggestion)
    setAiAccepted(true)
    setAiMessage(
      `Applied AI suggestion: ${getCategoryLabel(aiSuggestion)}. You can change it anytime before submitting.`,
    )
  }

  const handleIgnoreSuggestion = () => {
    setAiSuggestion(null)
    setAiAccepted(false)
    setAiMessage(
      'AI suggestion ignored. Please choose or keep your preferred category.',
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    if (loading) {
      setError('Please wait while your account is being checked.')
      return
    }

    if (!user) {
      setError('Please sign in before submitting a report.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)

    const locationText = formData.get('location_text')

    if (typeof locationText !== 'string') {
      setError('Please complete all required fields.')
      return
    }

    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    const cleanLocation = locationText.trim()

    const category = CATEGORIES.find(
      (item) => item.value === selectedCategory,
    )?.value

    if (!cleanTitle || !cleanLocation || !category) {
      setError('Please complete all required fields and select a category.')
      return
    }

    if (cleanTitle.length < 5 || cleanTitle.length > 120) {
      setError('Issue title must be between 5 and 120 characters.')
      return
    }

    if (
      cleanDescription.length < 20 ||
      cleanDescription.length > 2000
    ) {
      setError('Description must be between 20 and 2000 characters.')
      return
    }

    setSubmitting(true)

    try {
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          title: cleanTitle,
          description: cleanDescription,
          category,
          location_text: cleanLocation,
          location_lat: coordinates?.latitude ?? null,
          location_lng: coordinates?.longitude ?? null,
          ai_category_suggestion: lastAiCategory,
        })

      if (insertError) {
        throw insertError
      }

      form.reset()
      setTitle('')
      setDescription('')
      setSelectedCategory('')
      setCoordinates(null)
      setLocationMessage('')
      setAiSuggestion(null)
      setLastAiCategory(null)
      setAiAccepted(false)
      setAiMessage(null)
      setSuccess(true)
    } catch (err) {
      console.error('Report submission failed:', err)
      const message =
        typeof err === 'object' &&
          err !== null &&
          'message' in err &&
          typeof err.message === 'string'
          ? err.message
          : 'Something went wrong while submitting your report.'

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/"
          className="rounded text-sm text-civic-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500"
        >
          &larr; Back to home
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-bold text-gray-900">
        Report an Issue
      </h1>
      <p className="mb-8 text-gray-600">
        Help your community by reporting a civic problem. Reports are reviewed
        by authorized staff.
      </p>

      <form
        className="card space-y-6"
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Issue title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            minLength={5}
            maxLength={120}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
            }}
            placeholder="e.g. Pothole near the bus stop"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={20}
            maxLength={2000}
            rows={5}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
            }}
            placeholder="Describe the issue and any useful details..."
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        {/* Optional AI category suggestion */}
        <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium text-gray-900">
                Optional AI Category Suggestion
              </h2>
              <p className="text-xs text-gray-600">
                Uses only your issue title and description. You always choose
                the final category.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void handleSuggestCategory()
              }}
              disabled={aiLoading || submitting || loading || !user}
              aria-busy={aiLoading}
              className="btn-secondary text-sm"
            >
              {aiLoading ? 'Suggesting category...' : 'Suggest category with AI'}
            </button>
          </div>

          {aiLoading && (
            <p role="status" aria-live="polite" className="text-sm text-gray-600">
              Requesting AI category suggestion...
            </p>
          )}

          {aiSuggestion && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md border border-civic-200 bg-civic-50 p-3 text-sm"
            >
              <p className="font-medium text-civic-900">
                AI Suggestion: {getCategoryLabel(aiSuggestion)}
              </p>
              <p className="mt-1 text-xs text-civic-800">
                This is an optional suggestion only. Review it and accept or
                ignore it — your report will not be submitted automatically.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAcceptSuggestion}
                  disabled={aiAccepted || submitting}
                  className="rounded-md bg-civic-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-civic-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aiAccepted ? 'Suggestion applied' : 'Accept suggestion'}
                </button>
                <button
                  type="button"
                  onClick={handleIgnoreSuggestion}
                  disabled={submitting}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Ignore suggestion
                </button>
              </div>
            </div>
          )}

          {aiMessage && (
            <p role="status" aria-live="polite" className="text-sm text-gray-700">
              {aiMessage}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-700">
            Issue category
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={selectedCategory === cat.value}
                  onChange={() => {
                    setSelectedCategory(cat.value)
                    setAiAccepted(false)
                  }}
                  required
                  className="text-civic-600"
                />
                {cat.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="location"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Location description
          </label>
          <input
            id="location"
            name="location_text"
            type="text"
            required
            maxLength={300}
            placeholder="Enter a street, landmark, or area"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700">
            Map coordinates (optional)
          </legend>

          <p className="text-sm text-gray-600">
            Only request device location if you are physically at the issue.
            You can submit without coordinates.
          </p>

          <button
            type="button"
            onClick={handleGetLocation}
            disabled={gettingLocation || submitting}
            className="rounded-md border border-civic-600 px-4 py-2 text-sm font-medium text-civic-700 hover:bg-civic-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {gettingLocation ? 'Getting location...' : 'Use my device location'}
          </button>

          {coordinates && (
            <p className="text-sm text-gray-600">
              Coordinates captured successfully.
            </p>
          )}

          {locationMessage && (
            <p role="status" className="text-sm text-gray-600">
              {locationMessage}
            </p>
          )}

          <p className="text-xs text-gray-500">
            Exact coordinates are stored for authorized report handling.
            Public map locations are approximate.
          </p>
        </fieldset>

        <div>
          <label
            htmlFor="photo"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Photo (optional)
          </label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-gray-700"
          />
          <p className="mt-1 text-xs text-gray-500">
            Photo upload will be enabled in a later step.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-700">
            Your report was submitted successfully!{' '}
            <Link
              to="/reports/my"
              className="font-medium underline hover:no-underline"
            >
              View My Reports
            </Link>
          </p>
        )}

        {!user && !loading && (
          <p className="text-sm text-gray-600">
            You must <Link to="/sign-in" className="underline">sign in</Link> to submit a report.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || loading || !user}
          className="w-full rounded-md bg-civic-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  )
}
