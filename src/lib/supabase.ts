import { createClient } from '@supabase/supabase-js'

export interface SupabaseEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

export interface SupabaseConfig {
  url: string
  publishableKey: string
}

/**
 * Validates that required public Supabase environment variables are present.
 * Throws a clear configuration error if either variable is missing or empty.
 */
export function getSupabaseConfig(env: SupabaseEnv = import.meta.env): SupabaseConfig {
  const url = env.VITE_SUPABASE_URL?.trim()
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

  const missing: string[] = []
  if (!url) {
    missing.push('VITE_SUPABASE_URL')
  }
  if (!publishableKey) {
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY')
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase configuration: ${missing.join(', ')}. ` +
        'Copy .env.example to .env.local and set your Supabase project URL and publishable key.',
    )
  }

  return {
    url: url as string,
    publishableKey: publishableKey as string,
  }
}

/**
 * Creates a typed Supabase client from validated public configuration.
 */
export function createSupabaseClient(env: SupabaseEnv = import.meta.env) {
  const { url, publishableKey } = getSupabaseConfig(env)
  return createClient(url, publishableKey)
}

/**
 * Singleton Supabase client for application use.
 */
export const supabase = createSupabaseClient()
