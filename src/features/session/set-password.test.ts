import { describe, expect, it, vi } from 'vitest'
import { AuthError, type AuthGateway } from '@/shared/api'
import { setPassword } from './set-password'

function gatewayWith(signIn: AuthGateway['signIn']) {
  const updatePassword = vi.fn(async () => {})
  const gateway = { signIn, updatePassword } as unknown as AuthGateway
  return { gateway, updatePassword }
}

const ok = vi.fn(async () => ({ id: 'u1', kind: 'account' as const, email: 'a@b.com' }))

describe('setPassword', () => {
  it('changes the password without a challenge on the recovery path', async () => {
    const { gateway, updatePassword } = gatewayWith(ok)
    await setPassword(gateway, { password: 'a-longer-password' })
    expect(updatePassword).toHaveBeenCalledWith('a-longer-password')
  })

  it('re-authenticates before changing the password when a current one is offered', async () => {
    const signIn = vi.fn(ok)
    const { gateway, updatePassword } = gatewayWith(signIn)

    await setPassword(gateway, {
      password: 'a-longer-password',
      verify: { email: 'a@b.com', currentPassword: 'old-one' },
    })

    expect(signIn).toHaveBeenCalledWith({ email: 'a@b.com', password: 'old-one' })
    expect(updatePassword).toHaveBeenCalledWith('a-longer-password')
  })

  it('refuses the change when the current password is wrong, and says which one failed', async () => {
    const signIn = vi.fn(async () => {
      throw new AuthError('Invalid login credentials', 'invalid_credentials')
    })
    const { gateway, updatePassword } = gatewayWith(signIn as unknown as AuthGateway['signIn'])

    await expect(
      setPassword(gateway, {
        password: 'a-longer-password',
        verify: { email: 'a@b.com', currentPassword: 'wrong' },
      }),
    ).rejects.toMatchObject({ code: 'current_password_invalid' })
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('passes a transport failure through rather than blaming the password', async () => {
    const signIn = vi.fn(async () => {
      throw new AuthError('Failed to fetch', 'network')
    })
    const { gateway, updatePassword } = gatewayWith(signIn as unknown as AuthGateway['signIn'])

    await expect(
      setPassword(gateway, {
        password: 'a-longer-password',
        verify: { email: 'a@b.com', currentPassword: 'old-one' },
      }),
    ).rejects.toMatchObject({ code: 'network' })
    expect(updatePassword).not.toHaveBeenCalled()
  })
})
