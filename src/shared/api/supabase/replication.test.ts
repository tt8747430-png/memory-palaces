import { describe, expect, it } from 'vitest'
import type { Checkpoint } from '@/shared/api'
import {
  buildPullFilter,
  buildPushPayload,
  rowsToPullResult,
  splitUnseenOverwrites,
} from './replication'

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
  it('starts from the epoch with no checkpoint, and asks for no id tie-break', () => {
    expect(buildPullFilter(undefined)).toBe('updated_at.gt."1970-01-01T00:00:00Z"')
    expect(buildPullFilter(undefined)).not.toContain('id.gt')
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

describe('splitUnseenOverwrites', () => {
  const doc = (updatedAt: string, theme = 'light') => ({
    id: 'preferences',
    updatedAt,
    theme,
    _deleted: false,
  })
  const server = (updatedAt: string, theme = 'dark') => ({
    id: 'preferences',
    data: { id: 'preferences', updatedAt, theme },
    deleted: false,
  })

  it('pushes a write over the very copy this device last saw', () => {
    const row = { newDocumentState: doc('t9'), assumedMasterState: doc('t7') }
    const split = splitUnseenOverwrites([row] as never, [server('t7')])
    expect(split.pushable).toEqual([row])
    expect(split.refused).toEqual([])
  })

  it('refuses a write over a copy another device changed since, and hands that copy back to merge', () => {
    const row = { newDocumentState: doc('t9'), assumedMasterState: doc('t7') }
    const split = splitUnseenOverwrites([row] as never, [server('t8')])
    expect(split.pushable).toEqual([])
    expect(split.refused).toEqual([
      { id: 'preferences', updatedAt: 't8', theme: 'dark', _deleted: false },
    ])
  })

  it('refuses a write from a device that never saw the server’s copy at all', () => {
    const split = splitUnseenOverwrites([{ newDocumentState: doc('t9') }] as never, [server('t8')])
    expect(split.refused).toHaveLength(1)
  })

  it('pushes a document the server does not hold yet', () => {
    const row = { newDocumentState: doc('t9') }
    expect(splitUnseenOverwrites([row] as never, []).pushable).toEqual([row])
  })
})
