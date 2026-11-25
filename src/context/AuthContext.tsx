import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  fetchUserProfile,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  type SignInInput,
  type SignUpInput,
} from '../lib/auth'
import type { Profile } from '../types'
import { AuthContext, type AuthContextValue } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Provides authentication state and profile role context backed by Supabase Auth.
 * Restores persisted sessions on mount and subscribes to auth state changes.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function syncSession(nextSession: Session | null) {
      const nextUser = nextSession?.user ?? null
      setSession(nextSession)
      setUser(nextUser)

      if (nextUser) {
        const nextProfile = await fetchUserProfile(nextUser.id)
        if (active) {
          setProfile(nextProfile)
        }
      } else {
        setProfile(null)
      }
    }

    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!active) return
        if (!error) {
          await syncSession(data.session)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void restoreSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      void syncSession(nextSession).finally(() => {
        if (active) {
          setLoading(false)
        }
      })
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (input: SignInInput) => {
    const result = await signInWithEmail(input)
    setSession(result.session)
    setUser(result.user)
    if (result.user) {
      const nextProfile = await fetchUserProfile(result.user.id)
      setProfile(nextProfile)
    }
    return result
  }, [])

  const signUp = useCallback(async (input: SignUpInput) => {
    const result = await signUpWithEmail(input)
    if (result.session) {
      setSession(result.session)
      setUser(result.user)
      if (result.user) {
        const nextProfile = await fetchUserProfile(result.user.id)
        setProfile(nextProfile)
      }
    }
    return result
  }, [])

  const signOut = useCallback(async () => {
    await signOutUser()
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  const isAdmin = profile?.role === 'admin'

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isAdmin,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, profile, isAdmin, loading, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
