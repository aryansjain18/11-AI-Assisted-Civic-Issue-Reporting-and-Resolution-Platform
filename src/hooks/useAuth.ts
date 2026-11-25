import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '../context/auth-context'

/**
 * Accesses the current authentication state and auth actions.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
