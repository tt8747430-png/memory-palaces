import { describe, expect, it } from 'vitest'
import { makeAccountSession, makeGuestSession } from './types'

describe('session', () => {
  it('keeps the account’s email beside the name it shows', () => {
    const session = makeAccountSession('u1', { email: ' ada@x.io ', name: '' }, 't1')

    expect(session).toMatchObject({ kind: 'account', displayName: 'ada', email: 'ada@x.io' })
  })

  it('has no email for an account that signed in without one, nor for a guest', () => {
    expect(makeAccountSession('u1', { email: '', name: 'Ada' }, 't1').email).toBeNull()
    expect(makeGuestSession('g1', 't1').email).toBeNull()
  })
})
