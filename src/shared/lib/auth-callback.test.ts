import { describe, expect, it } from 'vitest'
import { parseAuthCallback } from './auth-callback'

describe('parseAuthCallback', () => {
  it('reads the PKCE code', () => {
    expect(parseAuthCallback('?code=abc123')).toMatchObject({ code: 'abc123', refused: false })
  })

  it('treats either error field as a refusal', () => {
    expect(parseAuthCallback('?error=access_denied').refused).toBe(true)
    expect(parseAuthCallback('?error_description=User%20cancelled').refused).toBe(true)
  })

  it('sends a recovery link to the set-password screen, and everything else home', () => {
    expect(parseAuthCallback('?code=x&next=recovery').next).toBe('recovery')
    expect(parseAuthCallback('?code=x').next).toBe('home')
    expect(parseAuthCallback('?code=x&next=somewhere-else').next).toBe('home')
  })

  it('copes with an empty return URL', () => {
    expect(parseAuthCallback('')).toEqual({ code: null, refused: false, next: 'home' })
  })
})
