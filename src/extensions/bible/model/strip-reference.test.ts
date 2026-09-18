import { describe, expect, it } from 'vitest'
import { stripReference } from './strip-reference'

describe('stripReference', () => {
  it('removes a leading book chapter:verse', () => {
    expect(stripReference('Genesis 1:1 In the beginning God created.')).toBe(
      'In the beginning God created.',
    )
  })

  it('removes a leading chapter:verse without a book', () => {
    expect(stripReference('1:1 In the beginning')).toBe('In the beginning')
  })

  it('removes a bracketed reference', () => {
    expect(stripReference('(1:1) In the beginning')).toBe('In the beginning')
  })

  it('removes a numbered book reference', () => {
    expect(stripReference('1 John 2:3 And hereby we know')).toBe('And hereby we know')
  })

  it('leaves a back that never had one', () => {
    expect(stripReference('In the beginning God created.')).toBe('In the beginning God created.')
  })

  it('leaves a back whose text merely starts with a number', () => {
    expect(stripReference('40 days and 40 nights')).toBe('40 days and 40 nights')
  })

  it('trims what it leaves behind', () => {
    expect(stripReference('Genesis 1:1   In the beginning  ')).toBe('In the beginning')
  })
})
