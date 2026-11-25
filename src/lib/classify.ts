import {
  CATEGORIES,
  type Category,
  type ClassificationResult,
  type ClassificationUnavailableReason,
} from '../types'
import { supabase } from './supabase'

const MIN_TITLE_LENGTH = 5
const MAX_TITLE_LENGTH = 120
const MIN_DESCRIPTION_LENGTH = 20
const MAX_DESCRIPTION_LENGTH = 2000
const DEFAULT_TIMEOUT_MS = 10_000

const ALLOWED_CATEGORIES: ReadonlySet<string> = new Set(
  CATEGORIES.map((item) => item.value),
)

const ALLOWED_UNAVAILABLE_REASONS: ReadonlySet<string> = new Set([
  'invalid_input',
  'not_configured',
  'rate_limited',
  'timeout',
  'invalid_response',
  'error',
])

export interface ClassificationInput {
  title: string
  description: string
}

export interface ValidatedClassificationInput {
  valid: true
  title: string
  description: string
}

export interface InvalidClassificationInput {
  valid: false
  message: string
}

/**
 * Validates and normalizes report title and description before sending to AI.
 * Only title and description are accepted; no PII or coordinates are allowed.
 */
export function validateClassificationInput(
  input: ClassificationInput,
): ValidatedClassificationInput | InvalidClassificationInput {
  const cleanTitle = input.title.trim()
  const cleanDescription = input.description.trim()

  if (cleanTitle.length < MIN_TITLE_LENGTH || cleanTitle.length > MAX_TITLE_LENGTH) {
    return {
      valid: false,
      message: `Enter an issue title (${MIN_TITLE_LENGTH}–${MAX_TITLE_LENGTH} characters) before requesting an AI suggestion.`,
    }
  }

  if (
    cleanDescription.length < MIN_DESCRIPTION_LENGTH ||
    cleanDescription.length > MAX_DESCRIPTION_LENGTH
  ) {
    return {
      valid: false,
      message: `Enter a description (${MIN_DESCRIPTION_LENGTH}–${MAX_DESCRIPTION_LENGTH} characters) before requesting an AI suggestion.`,
    }
  }

  return {
    valid: true,
    title: cleanTitle,
    description: cleanDescription,
  }
}

function isValidCategory(value: unknown): value is Category {
  return typeof value === 'string' && ALLOWED_CATEGORIES.has(value)
}

function normalizeUnavailableReason(
  value: unknown,
): ClassificationUnavailableReason {
  if (typeof value === 'string' && ALLOWED_UNAVAILABLE_REASONS.has(value)) {
    return value as ClassificationUnavailableReason
  }
  return 'error'
}

interface InvokeResponse {
  data: unknown
  error: unknown
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('TIMEOUT'))
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err: unknown) => {
        clearTimeout(timer)
        reject(err instanceof Error ? err : new Error('Request failed'))
      },
    )
  })
}

/**
 * Requests an optional AI category suggestion from the server-side
 * `classify-report` Supabase Edge Function.
 *
 * Security & privacy:
 * - Sends ONLY trimmed `title` and `description` (never reporter ID, email,
 *   coordinates, or photos).
 * - Treats provider output as untrusted and validates against `CATEGORIES`.
 * - Never fabricates rule-based guesses as AI output; returns `unavailable`
 *   when disabled, unconfigured, rate-limited, timed out, or malformed.
 */
export async function classifyReportText(
  input: ClassificationInput,
  options: { timeoutMs?: number } = {},
): Promise<ClassificationResult> {
  const validated = validateClassificationInput(input)
  if (!validated.valid) {
    return {
      status: 'unavailable',
      reason: 'invalid_input',
      message: validated.message,
    }
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const payload = {
    title: validated.title,
    description: validated.description,
  }

  try {
    const response = (await withTimeout(
      supabase.functions.invoke('classify-report', {
        body: payload,
      }),
      timeoutMs,
    )) as InvokeResponse

    if (response.error) {
      return {
        status: 'unavailable',
        reason: 'error',
        message:
          'AI category suggestion is currently unavailable. Please select a category manually.',
      }
    }

    const raw = response.data
    if (!raw || typeof raw !== 'object') {
      return {
        status: 'unavailable',
        reason: 'invalid_response',
        message:
          'AI returned an unexpected response. Please select a category manually.',
      }
    }

    const record = raw as Record<string, unknown>

    if (record.status === 'unavailable') {
      const reason = normalizeUnavailableReason(record.reason)
      const fallbackMessage =
        reason === 'not_configured'
          ? 'AI category suggestion is currently disabled on the server. Please select a category manually.'
          : reason === 'rate_limited'
            ? 'AI category suggestion is temporarily rate-limited. Please select a category manually.'
            : reason === 'timeout'
              ? 'AI category suggestion timed out. Please select a category manually.'
              : 'AI category suggestion is currently unavailable. Please select a category manually.'

      return {
        status: 'unavailable',
        reason,
        message: fallbackMessage,
      }
    }

    if (record.status === 'suggested' && isValidCategory(record.category)) {
      return {
        status: 'suggested',
        category: record.category,
        provider: 'gemini',
      }
    }

    return {
      status: 'unavailable',
      reason: 'invalid_response',
      message:
        'AI returned an unsupported category. Please select a category manually.',
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'TIMEOUT') {
      return {
        status: 'unavailable',
        reason: 'timeout',
        message:
          'AI category suggestion timed out. Please select a category manually.',
      }
    }

    return {
      status: 'unavailable',
      reason: 'error',
      message:
        'AI category suggestion is currently unavailable. Please select a category manually.',
    }
  }
}
