import { describe, expect, it } from 'vitest'
import { SupabaseAuthGateway } from '@/shared/api/supabase'
import { createAuthGateway } from './create-auth-gateway'
import { LocalAuthGateway } from './local-auth-gateway'

describe('createAuthGateway', () => {
  it('uses the local gateway when supabase is not configured', () => {
    expect(createAuthGateway(false)).toBeInstanceOf(LocalAuthGateway)
  })

  it('uses the supabase gateway when it is', () => {
    expect(createAuthGateway(true, {} as never)).toBeInstanceOf(SupabaseAuthGateway)
  })

  it('defaults to the local gateway in an unconfigured environment', () => {
    expect(createAuthGateway()).toBeInstanceOf(LocalAuthGateway)
  })
})
