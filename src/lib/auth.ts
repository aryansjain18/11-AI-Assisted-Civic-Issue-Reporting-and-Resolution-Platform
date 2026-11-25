import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '../types'
import { supabase } from './supabase'

export interface SignUpInput {
  email: string
  password: string
  displayName?: string
}

export interface SignInInput {
  email: string
  password: string
}

export interface AuthResult {
  user: User | null
  session: Session | null
  requiresEmailConfirmation: boolean
}

/**
 * Maps Supabase auth errors to safe, user-friendly messages without exposing internal details.
 */
export function formatAuthError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const rawMessage = error.message
    const message = typeof rawMessage === 'string' ? rawMessage : 'Authentication failed.'
    const lower = message.toLowerCase()

    if (lower.includes('invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.'
    }
    if (lower.includes('email not confirmed')) {
      return 'Please confirm your email address using the link sent to your inbox before signing in.'
    }
    if (lower.includes('user already registered')) {
      return 'An account with this email already exists. Try signing in instead.'
    }
    if (lower.includes('password should be at least')) {
      return 'Password must be at least 6 characters long.'
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment and try again.'
    }
    return message
  }
  return 'An unexpected authentication error occurred. Please try again.'
}

export async function signUpWithEmail({
  email,
  password,
  displayName,
}: SignUpInput): Promise<AuthResult> {
  const trimmedName = displayName?.trim()
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: trimmedName
      ? {
          data: {
            display_name: trimmedName,
          },
        }
      : undefined,
  })

  if (error) {
    throw new Error(formatAuthError(error))
  }

  return {
    user: data.user,
    session: data.session,
    requiresEmailConfirmation: Boolean(data.user && !data.session),
  }
}

export async function signInWithEmail({
  email,
  password,
}: SignInInput): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    throw new Error(formatAuthError(error))
  }

  return {
    user: data.user,
    session: data.session,
    requiresEmailConfirmation: false,
  }
}

export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(formatAuthError(error))
  }
}

/**
 * Fetches the authenticated user's profile from the database.
 * Used for UI routing only; database RLS and RPCs remain the authoritative security boundary.
 */
export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle()
      .overrideTypes<Profile | null, { merge: false }>()

    if (error) {
      return null
    }

    return data
  } catch {
    return null
  }
}
