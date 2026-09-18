import { describe, expect, it } from 'vitest'
import { structurallyEqual } from './structurally-equal'

describe('structurallyEqual', () => {
  it('compares plain values', () => {
    expect(structurallyEqual(1, 1)).toBe(true)
    expect(structurallyEqual('a', 'b')).toBe(false)
    expect(structurallyEqual(null, undefined)).toBe(false)
  })

  it('ignores key order — a document back from the server has its keys reordered', () => {
    expect(structurallyEqual({ a: 1, b: { c: [1, 2] } }, { b: { c: [1, 2] }, a: 1 })).toBe(true)
  })

  it('sees a difference anywhere inside', () => {
    expect(structurallyEqual({ a: [1, 2] }, { a: [2, 1] })).toBe(false)
    expect(structurallyEqual({ a: { b: 1 } }, { a: { b: 1, c: 2 } })).toBe(false)
    expect(structurallyEqual([1], { 0: 1 })).toBe(false)
  })
})
