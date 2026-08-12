import { useMemo } from 'react'
import type { AuthProvider } from '@/shared/api'
import { useAuthGateway } from '@/shared/lib'
import { useSessionStoreApi } from '@/entities/session'
import { useProfileStoreApi } from '@/entities/profile'
import { setProfile } from '@/features/profile'
import { signUpWithEmail, type SignUpWithEmailInput } from './sign-up-with-email'
import { signInWithEmail, type SignInWithEmailInput } from './sign-in-with-email'
import { continueAsGuest } from './continue-as-guest'
import { signOut } from './sign-out'
import { requestPasswordReset } from './request-password-reset'
import { setPassword } from './set-password'
import { signInWithProvider } from './sign-in-with-provider'

export interface AuthActions {
  /** Resolves with `sessionActive: false` when the account still needs email confirmation. */
  signUp: (input: SignUpWithEmailInput) => Promise<{ sessionActive: boolean }>
  signIn: (input: SignInWithEmailInput) => Promise<void>
  signInWithProvider: (provider: AuthProvider) => Promise<void>
  continueAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  setPassword: (password: string) => Promise<void>
}

export function useAuthActions(): AuthActions {
  const gateway = useAuthGateway()
  const sessionStore = useSessionStoreApi()
  const profileStore = useProfileStoreApi()

  return useMemo(() => {
    const deps = { gateway, sessionStore }
    return {
      signUp: async (input) => {
        const result = await signUpWithEmail(deps, input)
        await setProfile(profileStore, { name: input.name, email: input.email })
        return result
      },
      signIn: (input) => signInWithEmail(deps, input),
      // Redirect-based: the session lands on /auth/callback, not here.
      signInWithProvider: (provider) => signInWithProvider(gateway, provider),
      continueAsGuest: () => continueAsGuest(deps),
      signOut: () => signOut(deps),
      requestPasswordReset: (email) => requestPasswordReset(gateway, email),
      setPassword: (password) => setPassword(gateway, password),
    }
  }, [gateway, sessionStore, profileStore])
}
