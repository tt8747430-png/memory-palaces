import { describe, expect, it } from 'vitest'
import { cloneEntity, type Entity } from './entity'

interface Sample extends Entity {
  label: string
  tags: string[]
}

const original: Sample = { id: 'a', createdAt: 't0', updatedAt: 't1', label: 'x', tags: ['one'] }

describe('cloneEntity', () => {
  it('assigns a new id and fresh timestamps while copying the rest', () => {
    const copy = cloneEntity(original, 'b', 't2')
    expect(copy).toEqual({ id: 'b', createdAt: 't2', updatedAt: 't2', label: 'x', tags: ['one'] })
  })

  it('deep-copies nested data so the clone shares no references', () => {
    const copy = cloneEntity(original, 'b', 't2')
    expect(copy.tags).not.toBe(original.tags)
  })
})
