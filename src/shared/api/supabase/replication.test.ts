import { describe, expect, it } from 'vitest'
import { buildPullFilter, buildPushPayload, type Checkpoint, rowsToPullResult } from './replication'

describe('buildPushPayload', () => {
  it('maps documents to rows stamped with the user id', () => {
    const rows = buildPushPayload(
      [{ newDocumentState: { id: 'd1', name: 'x', _deleted: false } }] as never,
      'u1',
    )

    expect(rows).toEqual([
      { id: 'd1', user_id: 'u1', data: { id: 'd1', name: 'x' }, deleted: false },
    ])
  })

  it('sends tombstones as ordinary rows', () => {
    const rows = buildPushPayload(
      [{ newDocumentState: { id: 'd1', name: 'x', _deleted: true } }] as never,
      'u1',
    )

    expect(rows[0]).toMatchObject({ deleted: true })
  })
})

describe('buildPullFilter', () => {
  it('starts from the epoch with no checkpoint', () => {
    expect(buildPullFilter(undefined)).toContain('1970-01-01T00:00:00Z')
  })

  it('breaks ties on id so a batch boundary inside one transaction cannot skip rows', () => {
    const checkpoint: Checkpoint = { updated_at: '2026-07-22T10:00:00+00:00', id: 'c9' }

    expect(buildPullFilter(checkpoint)).toBe(
      'updated_at.gt."2026-07-22T10:00:00+00:00",and(updated_at.eq."2026-07-22T10:00:00+00:00",id.gt."c9")',
    )
  })
})

describe('rowsToPullResult', () => {
  const row = (id: string, updated_at: string) => ({
    id,
    data: { id, name: id },
    deleted: false,
    updated_at,
  })

  it('checkpoints on the last row of the batch', () => {
    const result = rowsToPullResult([row('a', 't1'), row('b', 't2')], undefined)

    expect(result.documents).toEqual([
      { id: 'a', name: 'a', _deleted: false },
      { id: 'b', name: 'b', _deleted: false },
    ])
    expect(result.checkpoint).toEqual({ updated_at: 't2', id: 'b' })
  })

  it('keeps the previous checkpoint when nothing changed', () => {
    const previous: Checkpoint = { updated_at: 't1', id: 'a' }

    expect(rowsToPullResult([], previous).checkpoint).toBe(previous)
  })

  it('carries tombstones through as deleted documents', () => {
    const result = rowsToPullResult(
      [{ id: 'a', data: { id: 'a' }, deleted: true, updated_at: 't1' }],
      undefined,
    )

    expect(result.documents[0]).toMatchObject({ _deleted: true })
  })
})
