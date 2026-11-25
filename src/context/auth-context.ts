import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { AuthResult, SignInInput, SignUpInput } from '../lib/auth'
import type { Profile } from '../types'

export interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  isAdmin: boolean
  loading: boolean
  signIn: (input: SignInInput) => Promise<AuthResult>
  signUp: (input: SignUpInput) => Promise<AuthResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
