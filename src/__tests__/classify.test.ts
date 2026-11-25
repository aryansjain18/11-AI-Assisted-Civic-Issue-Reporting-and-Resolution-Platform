import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  classifyReportText,
  validateClassificationInput,
} from '../lib/classify'

const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}))

describe('classify.ts (M5 optional AI classification)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates input length and rejects short or oversized text without calling the Edge Function', async () => {
    expect(
      validateClassificationInput({
        title: 'Hi',
        description: 'This description is long enough to pass validation.',
      }).valid,
    ).toBe(false)

    expect(
      validateClassificationInput({
        title: 'Broken streetlight',
        description: 'Too short',
      }).valid,
    ).toBe(false)

    const result = await classifyReportText({
      title: '   ',
      description: 'Short',
    })

    expect(result.status).toBe('unavailable')
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('invalid_input')
    }
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('returns a valid category suggestion and sends ONLY title and description', async () => {
    mockInvoke.mockResolvedValue({
      data: { status: 'suggested', category: 'streetlight' },
      error: null,
    })

    const extraInput = {
      title: '  Streetlight out near park  ',
      description: '  The lamp post at the north entrance has been dark for three nights.  ',
      reporter_id: 'user-123',
      email: 'citizen@example.com',
      location_lat: 37.7749,
      location_lng: -122.4194,
    }

    const result = await classifyReportText(extraInput)

    expect(result).toEqual({
      status: 'suggested',
      category: 'streetlight',
      provider: 'gemini',
    })

    expect(mockInvoke).toHaveBeenCalledTimes(1)
    expect(mockInvoke).toHaveBeenCalledWith('classify-report', {
      body: {
        title: 'Streetlight out near park',
        description:
          'The lamp post at the north entrance has been dark for three nights.',
      },
    })
  })

  it('rejects unsupported AI categories and treats them as unavailable', async () => {
    mockInvoke.mockResolvedValue({
      data: { status: 'suggested', category: 'nuclear_hazard' },
      error: null,
    })

    const result = await classifyReportText({
      title: 'Strange spill on road',
      description: 'There is an unknown puddle near the intersection.',
    })

    expect(result.status).toBe('unavailable')
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('invalid_response')
    }
  })

  it('handles malformed provider responses safely', async () => {
    mockInvoke.mockResolvedValue({
      data: 'unexpected string payload',
      error: null,
    })

    const result = await classifyReportText({
      title: 'Broken curb near school',
      description: 'The concrete curb has crumbled near the crosswalk.',
    })

    expect(result.status).toBe('unavailable')
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('invalid_response')
    }
  })

  it('handles missing server provider configuration gracefully', async () => {
    mockInvoke.mockResolvedValue({
      data: { status: 'unavailable', reason: 'not_configured' },
      error: null,
    })

    const result = await classifyReportText({
      title: 'Deep pothole on Oak St',
      description: 'A wide pothole is damaging car tires near Oak St.',
    })

    expect(result.status).toBe('unavailable')
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('not_configured')
      expect(result.message).toMatch(/disabled/i)
    }
  })

  it('handles provider errors and rate limits gracefully', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Edge Function error' },
    })

    const errorResult = await classifyReportText({
      title: 'Overflowing bin',
      description: 'Public trash bin on 2nd Ave is overflowing onto sidewalk.',
    })
    expect(errorResult.status).toBe('unavailable')

    mockInvoke.mockResolvedValueOnce({
      data: { status: 'unavailable', reason: 'rate_limited' },
      error: null,
    })

    const rateLimitResult = await classifyReportText({
      title: 'Overflowing bin',
      description: 'Public trash bin on 2nd Ave is overflowing onto sidewalk.',
    })
    expect(rateLimitResult.status).toBe('unavailable')
    if (rateLimitResult.status === 'unavailable') {
      expect(rateLimitResult.reason).toBe('rate_limited')
    }
  })

  it('handles request timeouts gracefully', async () => {
    mockInvoke.mockImplementation(() => new Promise(() => undefined))

    const result = await classifyReportText(
      {
        title: 'Blocked storm drain',
        description: 'Leaves and debris are blocking the storm drain on Elm St.',
      },
      { timeoutMs: 20 },
    )

    expect(result.status).toBe('unavailable')
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('timeout')
    }
  })

  it('Edge Function keeps GEMINI_API_KEY server-side, enforces auth, and never logs report text', () => {
    const fnSql = readFileSync(
      resolve(process.cwd(), 'supabase/functions/classify-report/index.ts'),
      'utf-8',
    )

    expect(fnSql).toMatch(/Deno\.env\.get\('GEMINI_API_KEY'\)/)
    expect(fnSql).not.toMatch(/VITE_[A-Z0-9_]+/)
    expect(fnSql).not.toMatch(/import\.meta\.env/)
    expect(fnSql).toMatch(/auth\.getUser\(\)/)
    expect(fnSql).toMatch(/ALLOWED_CATEGORIES/)
    expect(fnSql).not.toMatch(/console\.log/)
  })
})
