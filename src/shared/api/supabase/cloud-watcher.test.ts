import { describe, expect, it, vi } from 'vitest'
import type { RemoteChangeEvent } from '@/shared/api'
import { createCloudWatcher } from './cloud-watcher'

type Handler = (payload: unknown) => void

function fakeSupabase() {
  const handlers: { table: string; handler: Handler }[] = []
  const removeChannel = vi.fn().mockResolvedValue(undefined)
  const subscribe = vi.fn()
  const topics: string[] = []
  const channel = {
    on: (_event: string, filter: { table: string }, handler: Handler) => {
      handlers.push({ table: filter.table, handler })
      return channel
    },
    subscribe,
  }
  const client = {
    channel: (topic: string) => {
      topics.push(topic)
      return channel
    },
    removeChannel,
  }
  const emit = (table: string, row: unknown) => {
    for (const entry of handlers) if (entry.table === table) entry.handler({ new: row })
  }
  return { client: client as never, emit, removeChannel, subscribe, topics, handlers }
}

describe('createCloudWatcher', () => {
  it('reports a position and nothing else — it never applies a document', () => {
    const { client, emit } = fakeSupabase()
    const seen: RemoteChangeEvent[] = []

    createCloudWatcher(client, ['decks'], 'u1', (event) => seen.push(event))
    emit('decks', {
      id: 'd1',
      updated_at: '2026-02-01T00:00:00Z',
      data: { id: 'd1', name: 'Kanji' },
      deleted: false,
    })

    expect(seen).toEqual([{ table: 'decks', id: 'd1', updated_at: '2026-02-01T00:00:00Z' }])
    // `data` is deliberately not forwarded: applying documents is a Sync's job, not the watcher's.
    expect(Object.keys(seen[0] ?? {})).toEqual(['table', 'id', 'updated_at'])
  })

  it('subscribes once for every watched table', () => {
    const { client, handlers, subscribe, topics } = fakeSupabase()

    createCloudWatcher(client, ['decks', 'cards', 'folders'], 'u1', () => {})

    expect(handlers.map((entry) => entry.table)).toEqual(['decks', 'cards', 'folders'])
    // One long-lived channel, so there is no random topic to keep two replications apart.
    expect(topics).toEqual(['cloud:u1'])
    expect(subscribe).toHaveBeenCalledTimes(1)
  })

  it('ignores an event with no row behind it', () => {
    const { client, emit } = fakeSupabase()
    const seen: RemoteChangeEvent[] = []

    createCloudWatcher(client, ['decks'], 'u1', (event) => seen.push(event))
    emit('decks', undefined)
    emit('decks', {})

    expect(seen).toEqual([])
  })

  it('closes the channel on stop, so a signed-out user keeps no socket open', async () => {
    const { client, removeChannel } = fakeSupabase()

    await createCloudWatcher(client, ['decks'], 'u1', () => {}).stop()

    expect(removeChannel).toHaveBeenCalled()
  })
})
