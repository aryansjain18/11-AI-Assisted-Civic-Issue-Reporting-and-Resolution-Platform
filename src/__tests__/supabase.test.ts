import { describe, it, expect, vi, afterEach } from 'vitest'

describe('Supabase client configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('throws a clear configuration error on import when env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
    vi.resetModules()

    await expect(import('../lib/supabase')).rejects.toThrowError(
      /Missing required Supabase configuration: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY/,
    )
  })

  it('throws a clear error when VITE_SUPABASE_URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key')
    vi.resetModules()

    const { getSupabaseConfig } = await import('../lib/supabase')
    expect(() =>
      getSupabaseConfig({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example' }),
    ).toThrowError(/Missing required Supabase configuration: VITE_SUPABASE_URL/)
  })

  it('throws a clear error when VITE_SUPABASE_PUBLISHABLE_KEY is missing or blank', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key')
    vi.resetModules()

    const { getSupabaseConfig } = await import('../lib/supabase')
    expect(() =>
      getSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: '   ',
      }),
    ).toThrowError(/Missing required Supabase configuration: VITE_SUPABASE_PUBLISHABLE_KEY/)
  })

  it('returns trimmed URL and publishable key when both are provided', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key')
    vi.resetModules()

    const { getSupabaseConfig } = await import('../lib/supabase')
    const config = getSupabaseConfig({
      VITE_SUPABASE_URL: ' https://example.supabase.co ',
      VITE_SUPABASE_PUBLISHABLE_KEY: ' sb_publishable_test_key ',
    })

    expect(config).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_test_key',
    })
  })

  it('initializes singleton supabase client when valid env vars are present', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key')
    vi.resetModules()

    const { supabase } = await import('../lib/supabase')
    expect(supabase).toBeDefined()
    expect(typeof supabase.auth.getSession).toBe('function')
    expect(typeof supabase.from).toBe('function')
  })
})
