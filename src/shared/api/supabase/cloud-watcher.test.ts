import { describe, expect, it, vi } from 'vitest'
import type { RemoteChangeEvent, RemoteChangeHandlers } from '@/shared/api'
import { createCloudWatcher } from './cloud-watcher'

type Handler = (payload: unknown) => void
type Status = (status: string) => void

function fakeSupabase() {
  const handlers: { table: string; filter: string | undefined; handler: Handler }[] = []
  const removeChannel = vi.fn().mockResolvedValue(undefined)
  let onStatus: Status = () => {}
  const subscribe = vi.fn((callback: Status) => {
    onStatus = callback
  })
  const topics: string[] = []
  const channel = {
    on: (_event: string, filter: { table: string; filter?: string }, handler: Handler) => {
      handlers.push({ table: filter.table, filter: filter.filter, handler })
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
  const status = (value: string) => onStatus(value)
  return { client: client as never, emit, status, removeChannel, subscribe, topics, handlers }
}

const collecting = (seen: RemoteChangeEvent[], onReconnect = () => {}): RemoteChangeHandlers => ({
  onChange: (event) => seen.push(event),
  onReconnect,
})

describe('createCloudWatcher', () => {
  it('reports a position and nothing else — it never applies a document', () => {
    const { client, emit } = fakeSupabase()
    const seen: RemoteChangeEvent[] = []

    createCloudWatcher(client, ['decks'], 'u1', collecting(seen))
    emit('decks', {
      id: 'd1',
      updated_at: '2026-02-01T00:00:00Z',
      data: { id: 'd1', name: 'Kanji' },
      deleted: false,
    })

    expect(seen).toEqual([{ table: 'decks', id: 'd1', updated_at: '2026-02-01T00:00:00Z' }])
    expect(Object.keys(seen[0] ?? {})).toEqual(['table', 'id', 'updated_at'])
  })

  it('subscribes once for every watched table, to this account’s rows only', () => {
    const { client, handlers, subscribe, topics } = fakeSupabase()

    createCloudWatcher(client, ['decks', 'cards', 'folders'], 'u1', collecting([]))

    expect(handlers.map((entry) => entry.table)).toEqual(['decks', 'cards', 'folders'])
    expect(handlers.every((entry) => entry.filter === 'user_id=eq.u1')).toBe(true)
    expect(topics).toEqual(['cloud:u1'])
    expect(subscribe).toHaveBeenCalledTimes(1)
  })

  it('ignores an event with no row behind it', () => {
    const { client, emit } = fakeSupabase()
    const seen: RemoteChangeEvent[] = []

    createCloudWatcher(client, ['decks'], 'u1', collecting(seen))
    emit('decks', undefined)
    emit('decks', {})

    expect(seen).toEqual([])
  })

  it('reports a reconnect the second time the channel subscribes, never the first', () => {
    const { client, status } = fakeSupabase()
    const onReconnect = vi.fn()

    createCloudWatcher(client, ['decks'], 'u1', collecting([], onReconnect))
    status('SUBSCRIBED')
    expect(onReconnect).not.toHaveBeenCalled()
    status('CHANNEL_ERROR')
    status('SUBSCRIBED')

    expect(onReconnect).toHaveBeenCalledTimes(1)
  })

  it('closes the channel on stop, so a signed-out user keeps no socket open', async () => {
    const { client, removeChannel } = fakeSupabase()

    await createCloudWatcher(client, ['decks'], 'u1', collecting([])).stop()

    expect(removeChannel).toHaveBeenCalled()
  })
})
