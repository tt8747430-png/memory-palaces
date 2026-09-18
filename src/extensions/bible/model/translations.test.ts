import { describe, expect, it } from 'vitest'
import { DEFAULT_TRANSLATION } from './verse'
import { translationName } from './translations'

describe('translationName', () => {
  it('names the bundled translation rather than showing its id', () => {
    expect(translationName(DEFAULT_TRANSLATION)).toBe('World English Bible')
  })

  it('falls back to the abbreviation for one it does not know', () => {
    expect(translationName('kjv')).toBe('KJV')
  })
})
