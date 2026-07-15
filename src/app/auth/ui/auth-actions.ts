import { Injectable, inject } from '@angular/core'
import { AUTH_GATEWAY, SessionStore, ProfileStore } from '../data/stores'
import { signUpWithEmail } from '../commands/sign-up-with-email'
import type { SignUpWithEmailInput } from '../commands/sign-up-with-email'
import { signInWithEmail } from '../commands/sign-in-with-email'
import { continueAsGuest } from '../commands/continue-as-guest'
import { signOut } from '../commands/sign-out'
import { requestPasswordReset } from '../commands/request-password-reset'
import { setProfile } from '../commands/set-profile'

/** Auth use-cases bound to the app's gateway and stores. */
@Injectable({ providedIn: 'root' })
export class AuthActions {
  private readonly gateway = inject(AUTH_GATEWAY)
  private readonly sessionStore = inject(SessionStore)
  private readonly profileStore = inject(ProfileStore)

  private get deps() {
    return { gateway: this.gateway, sessionStore: this.sessionStore }
  }

  async signUp(input: SignUpWithEmailInput): Promise<void> {
    await signUpWithEmail(this.deps, input)
    await setProfile(this.profileStore, { name: input.name, email: input.email })
  }

  signIn(email: string): Promise<void> {
    return signInWithEmail(this.deps, email)
  }

  continueAsGuest(): Promise<void> {
    return continueAsGuest(this.deps)
  }

  signOut(): Promise<void> {
    return signOut(this.deps)
  }

  requestPasswordReset(email: string): Promise<void> {
    return requestPasswordReset(this.gateway, email)
  }
}
