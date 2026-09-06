import { AuthError, type AuthGateway, isAuthError } from '@/shared/api'

export interface SetPasswordInput {
  password: string
  /**
   * The account's own address and the password it currently has. Present whenever the person is
   * signed in and knows the old password; absent on the recovery path, where the link already
   * proved they own the address and they are here precisely because they do not know it.
   */
  verify?: { email: string; currentPassword: string }
}

/**
 * Sets a new password for whoever is signed in.
 *
 * When a current password is offered, it is *checked* — by signing in with it, which is what
 * re-authentication is — before the new one is written. The screen collected that field and passed
 * it nowhere: it read as a security control and was decoration, so anyone holding an unlocked
 * device could take the account over. The provider enforces its own rules on the new password on
 * top of this.
 */
export async function setPassword(gateway: AuthGateway, input: SetPasswordInput): Promise<void> {
  if (input.verify) {
    try {
      await gateway.signIn({ email: input.verify.email, password: input.verify.currentPassword })
    } catch (error) {
      // Only a rejected password becomes "wrong password". A rate limit or a dead network is not
      // the person's mistake and keeps its own code, so the screen can say what actually happened.
      if (isAuthError(error) && error.code === 'invalid_credentials') {
        throw new AuthError('Current password is incorrect', 'current_password_invalid')
      }
      throw error
    }
  }
  await gateway.updatePassword(input.password)
}
