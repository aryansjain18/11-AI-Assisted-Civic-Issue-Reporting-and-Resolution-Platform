import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface LocationState {
  from?: {
    pathname?: string
  }
}

export default function SignInPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirectTo = state?.from?.pathname ?? '/reports/my'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    let valid = true
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setEmailError('Email address is required.')
      valid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.')
      valid = false
    } else {
      setEmailError('')
    }

    if (!password) {
      setPasswordError('Password is required.')
      valid = false
    } else {
      setPasswordError('')
    }

    return valid
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (!validate()) {
      return
    }

    setSubmitting(true)
    try {
      await signIn({ email, password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to sign in. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Sign in to CivicFix</h1>
          <p className="mt-2 text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link
              to="/sign-up"
              className="rounded font-medium text-civic-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500"
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="card">
          {formError && (
            <div
              className="mb-6 rounded-md border border-danger-500/30 bg-danger-50 px-4 py-3 text-sm text-danger-700"
              role="alert"
            >
              {formError}
            </div>
          )}

          <form
            aria-label="Sign in form"
            noValidate
            onSubmit={(e) => void handleSubmit(e)}
          >
            <div className="mb-4">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                }}
                disabled={submitting}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'signin-email-error' : undefined}
                className="form-input"
                placeholder="you@example.com"
              />
              {emailError && (
                <p id="signin-email-error" className="form-error" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                disabled={submitting}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'signin-password-error' : undefined}
                className="form-input"
                placeholder="••••••••"
              />
              {passwordError && (
                <p id="signin-password-error" className="form-error" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
