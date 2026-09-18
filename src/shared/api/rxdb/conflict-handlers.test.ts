import { describe, expect, it } from 'vitest'
import type { HistoryEntry } from '@/entities/learning-history'
import { firstWriteWins, mergeAgainstBase } from './conflict-handlers'

const CTX = 'test'

const doc = <T>(value: T) => value as T & { _deleted: boolean }

interface Named {
  id: string
  updatedAt: string
  name: string
  note?: string
}

describe('mergeAgainstBase', () => {
  const handler = mergeAgainstBase<Named>()

  it('keeps what each device changed when it knows what both started from', async () => {
    const resolved = await handler.resolve(
      {
        assumedMasterState: doc({ id: 'd1', updatedAt: 't1', name: 'seen', note: 'seen' }),
        realMasterState: doc({ id: 'd1', updatedAt: 't2', name: 'seen', note: 'theirs' }),
        newDocumentState: doc({ id: 'd1', updatedAt: 't3', name: 'mine', note: 'seen' }),
      },
      CTX,
    )
    expect(resolved).toMatchObject({ name: 'mine', note: 'theirs', updatedAt: 't3' })
  })

  it('keeps a deletion made on one device while the other only edited', async () => {
    const resolved = await handler.resolve(
      {
        assumedMasterState: doc({ id: 'd1', updatedAt: 't1', name: 'seen' }),
        realMasterState: doc({ id: 'd1', updatedAt: 't2', name: 'edited' }),
        newDocumentState: { id: 'd1', updatedAt: 't3', name: 'seen', _deleted: true },
      },
      CTX,
    )
    expect(resolved).toMatchObject({ _deleted: true, name: 'edited' })
  })

  it('falls back to the newer document when this device never pulled it', async () => {
    const resolved = await handler.resolve(
      {
        realMasterState: doc({ id: 'd1', updatedAt: 't2', name: 'server' }),
        newDocumentState: doc({ id: 'd1', updatedAt: 't1', name: 'local' }),
      },
      CTX,
    )
    expect(resolved).toMatchObject({ name: 'server' })
  })

  it('sees no conflict when both sides carry the same clock and tombstone', () => {
    const a = doc({ id: 'd1', updatedAt: 't1', name: 'x' })
    const b = doc({ id: 'd1', updatedAt: 't1', name: 'x' })
    expect(handler.isEqual(a, b, CTX)).toBe(true)
    expect(handler.isEqual(a, { ...b, updatedAt: 't2' }, CTX)).toBe(false)
    expect(handler.isEqual(a, { ...b, _deleted: true }, CTX)).toBe(false)
  })

  it('still sees a conflict when two devices wrote different content on the same clock', () => {
    const local = doc({ id: 'd1', updatedAt: 't1', name: 'local' })
    const server = doc({ id: 'd1', updatedAt: 't1', name: 'server' })
    expect(handler.isEqual(local, server, CTX)).toBe(false)
  })
})

describe('firstWriteWins', () => {
  const entry = (createdAt: string): HistoryEntry => ({
    id: 'h1',
    createdAt,
    updatedAt: createdAt,
    cardId: 'c1',
    deckId: 'd1',
    kind: 'answered',
    outcome: 'gotIt',
  })

  it('keeps the copy already in the cloud — two copies of an id are the same answer', async () => {
    const resolved = await firstWriteWins<HistoryEntry>().resolve(
      {
        realMasterState: doc(entry('2026-01-01T00:00:00.000Z')),
        newDocumentState: doc(entry('2026-01-02T00:00:00.000Z')),
      },
      CTX,
    )
    expect(resolved).toMatchObject({ createdAt: '2026-01-01T00:00:00.000Z' })
  })

  it('converges: two devices writing the same entry id produce one document, not two', async () => {
    const handler = firstWriteWins<HistoryEntry>()
    const server = doc(entry('2026-01-01T00:00:00.000Z'))
    const first = await handler.resolve(
      { realMasterState: server, newDocumentState: doc(entry('2026-01-02T00:00:00.000Z')) },
      CTX,
    )
    const second = await handler.resolve(
      { realMasterState: server, newDocumentState: doc(entry('2026-01-03T00:00:00.000Z')) },
      CTX,
    )
    expect(first).toEqual(second)
    expect(first.id).toBe('h1')
  })

  it('still reports two genuinely different writes as unequal', () => {
    const handler = firstWriteWins<HistoryEntry>()
    const a = doc({ ...entry('2026-01-01T00:00:00.000Z'), outcome: 'gotIt' as const })
    const b = doc({ ...entry('2026-01-01T00:00:00.000Z'), outcome: 'notQuite' as const })
    expect(handler.isEqual(a, b, CTX)).toBe(false)
  })
})
