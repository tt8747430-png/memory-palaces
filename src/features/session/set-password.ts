import { AuthError, type AuthGateway, isAuthError } from '@/shared/api'

export interface SetPasswordInput {
  password: string
  verify?: { email: string; currentPassword: string }
}

export async function setPassword(gateway: AuthGateway, input: SetPasswordInput): Promise<void> {
  if (input.verify) {
    try {
      await gateway.signIn({ email: input.verify.email, password: input.verify.currentPassword })
    } catch (error) {
      if (isAuthError(error) && error.code === 'invalid_credentials') {
        throw new AuthError('Current password is incorrect', 'current_password_invalid')
      }
      throw error
    }
  }
  await gateway.updatePassword(input.password)
}
