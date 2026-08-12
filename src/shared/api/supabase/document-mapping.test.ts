import { describe, expect, it } from 'vitest'
import { docToRow, rowToDoc } from './document-mapping'

describe('document mapping', () => {
  it('strips _deleted into the deleted column and never sends updated_at', () => {
    const row = docToRow({ id: 'd1', name: 'Deck', _deleted: true }, 'u1')

    expect(row).toEqual({ id: 'd1', user_id: 'u1', data: { id: 'd1', name: 'Deck' }, deleted: true })
    // The server clock owns updated_at — a client value would break the pull checkpoint.
    expect('updated_at' in row).toBe(false)
  })

  it('treats a document with no tombstone as live', () => {
    expect(docToRow({ id: 'd1', name: 'Deck' }, 'u1').deleted).toBe(false)
  })

  it('reconstitutes _deleted from the deleted column on pull', () => {
    const doc = rowToDoc({
      id: 'd1',
      data: { id: 'd1', name: 'Deck' },
      deleted: false,
      updated_at: 't',
    })

    expect(doc).toEqual({ id: 'd1', name: 'Deck', _deleted: false })
  })

  it('round-trips a tombstone', () => {
    const row = docToRow({ id: 'd1', name: 'Deck', _deleted: true }, 'u1')
    expect(rowToDoc({ ...row, updated_at: 't' })._deleted).toBe(true)
  })
})
