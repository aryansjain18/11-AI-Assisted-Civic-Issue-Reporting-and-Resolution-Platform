import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function SignUpPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
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
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.')
      valid = false
    } else {
      setPasswordError('')
    }

    return valid
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    if (!validate()) {
      return
    }

    setSubmitting(true)
    try {
      const result = await signUp({ email, password, displayName })
      if (result.requiresEmailConfirmation) {
        setSuccessMessage(
          'Account created. Please check your email inbox and click the confirmation link before signing in.',
        )
        setPassword('')
      } else {
        navigate('/reports/my', { replace: true })
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Unable to create account. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/sign-in"
              className="rounded font-medium text-civic-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-500"
            >
              Sign in
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

          {successMessage && (
            <div
              className="mb-6 rounded-md border border-success-500/30 bg-success-50 px-4 py-3 text-sm text-success-700"
              role="status"
            >
              {successMessage}
            </div>
          )}

          <form
            aria-label="Sign up form"
            noValidate
            onSubmit={(e) => void handleSubmit(e)}
          >
            <div className="mb-4">
              <label htmlFor="display-name" className="form-label">
                Display name <span className="text-gray-500">(optional)</span>
              </label>
              <input
                id="display-name"
                type="text"
                name="display_name"
                autoComplete="name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                }}
                disabled={submitting}
                className="form-input"
                placeholder="Your name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="signup-email" className="form-label">
                Email address
              </label>
              <input
                id="signup-email"
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
                aria-describedby={emailError ? 'signup-email-error' : undefined}
                className="form-input"
                placeholder="you@example.com"
              />
              {emailError && (
                <p id="signup-email-error" className="form-error" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="signup-password" className="form-label">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                disabled={submitting}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={
                  passwordError ? 'signup-password-error' : 'signup-password-hint'
                }
                className="form-input"
                placeholder="At least 6 characters"
              />
              <p id="signup-password-hint" className="mt-1 text-xs text-gray-500">
                Minimum 6 characters.
              </p>
              {passwordError && (
                <p id="signup-password-error" className="form-error" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
