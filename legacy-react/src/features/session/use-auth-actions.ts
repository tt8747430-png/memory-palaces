import { useMemo } from 'react'
import { useAuthGateway } from '@/shared/lib'
import { useSessionStoreApi } from '@/entities/session'
import { useProfileStoreApi } from '@/entities/profile'
import { setProfile } from '@/features/profile'
import { signUpWithEmail, type SignUpWithEmailInput } from './sign-up-with-email'
import { signInWithEmail } from './sign-in-with-email'
import { continueAsGuest } from './continue-as-guest'
import { signOut } from './sign-out'
import { requestPasswordReset } from './request-password-reset'

export interface AuthActions {
  signUp: (input: SignUpWithEmailInput) => Promise<void>
  signIn: (email: string) => Promise<void>
  continueAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
}

export function useAuthActions(): AuthActions {
  const gateway = useAuthGateway()
  const sessionStore = useSessionStoreApi()
  const profileStore = useProfileStoreApi()

  return useMemo(() => {
    const deps = { gateway, sessionStore }
    return {
      signUp: async (input) => {
        await signUpWithEmail(deps, input)
        await setProfile(profileStore, { name: input.name, email: input.email })
      },
      signIn: (email) => signInWithEmail(deps, email),
      continueAsGuest: () => continueAsGuest(deps),
      signOut: () => signOut(deps),
      requestPasswordReset: (email) => requestPasswordReset(gateway, email),
    }
  }, [gateway, sessionStore, profileStore])
}
