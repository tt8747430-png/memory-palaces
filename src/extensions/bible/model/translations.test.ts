import { describe, expect, it } from 'vitest'
import { BOOKS } from './canon'
import {
  CORNILESCU_2024,
  DEFAULT_TRANSLATION,
  findTranslation,
  translationName,
} from './translations'

describe('the translations', () => {
  it('bundles Cornilescu 2024, in Romanian, as the default', () => {
    expect(DEFAULT_TRANSLATION).toBe('cornilescu-2024')
    expect(findTranslation(DEFAULT_TRANSLATION)).toBe(CORNILESCU_2024)
    expect(CORNILESCU_2024.language).toBe('ro')
  })

  it('names and abbreviates every book of the canon', () => {
    for (const book of BOOKS) {
      expect(CORNILESCU_2024.books[book.code].name.trim()).not.toBe('')
      expect(CORNILESCU_2024.books[book.code].abbreviation.trim()).not.toBe('')
    }
    expect(CORNILESCU_2024.books['1KI']).toEqual({ name: '1 Împărați', abbreviation: '1Împ' })
    expect(CORNILESCU_2024.books.ZEP).toEqual({ name: 'Țefania', abbreviation: 'Țef' })
  })

  it('gives every book a distinct abbreviation', () => {
    const abbreviations = BOOKS.map((book) => CORNILESCU_2024.books[book.code].abbreviation)
    expect(new Set(abbreviations).size).toBe(66)
  })
})

describe('translationName', () => {
  it('names the bundled translation rather than showing its id', () => {
    expect(translationName(DEFAULT_TRANSLATION)).toBe('Biblia Dumitru Cornilescu 2024')
  })

  it('falls back to the id, upper-cased, for one it does not know', () => {
    expect(translationName('kjv')).toBe('KJV')
  })
})
