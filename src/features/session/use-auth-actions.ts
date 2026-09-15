import { useMemo } from 'react'
import type { OAuthProvider } from '@/shared/api'
import { useAuthGateway } from '@/shared/lib'
import { useSessionStoreApi } from '@/entities/session'
import { useProfileStoreApi } from '@/entities/profile'
import { setProfile } from '@/features/profile'
import { signUpWithEmail, type SignUpWithEmailInput } from './sign-up-with-email'
import { signInWithEmail, type SignInWithEmailInput } from './sign-in-with-email'
import { continueAsGuest } from './continue-as-guest'
import { signOut } from './sign-out'
import { requestPasswordReset } from './request-password-reset'
import { setPassword, type SetPasswordInput } from './set-password'

export interface AuthActions {
  signUp: (input: SignUpWithEmailInput) => Promise<{ sessionActive: boolean }>
  signIn: (input: SignInWithEmailInput) => Promise<void>
  signInWithProvider: (provider: OAuthProvider) => Promise<void>
  continueAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  setPassword: (input: SetPasswordInput) => Promise<void>
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
      signInWithProvider: (provider) => gateway.signInWithProvider(provider),
      continueAsGuest: () => continueAsGuest(deps),
      signOut: () => signOut(deps),
      requestPasswordReset: (email) => requestPasswordReset(gateway, email),
      setPassword: (input) => setPassword(gateway, input),
    }
  }, [gateway, sessionStore, profileStore])
}
