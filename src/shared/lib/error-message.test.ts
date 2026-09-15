import { describe, expect, it } from 'vitest'
import { errorMessage } from './error-message'

describe('errorMessage', () => {
  it('reads an Error’s message and stringifies anything else', () => {
    expect(errorMessage(new Error('push refused'))).toBe('push refused')
    expect(errorMessage('offline')).toBe('offline')
    expect(errorMessage(404)).toBe('404')
  })
})
