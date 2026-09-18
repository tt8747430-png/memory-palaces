import { describe, expect, it } from 'vitest'
import { buildPullFilter } from './replication'
import { fetchRemoteDocuments, fetchRemoteParents, peekRemoteChanges } from './peek'

interface Call {
  table: string
  columns: string
  filter: string
  signal?: AbortSignal
}

function fakeSupabase(pages: Record<string, unknown[][]>) {
  const calls: Call[] = []
  const nextPage = new Map<string, number>()
  const client = {
    from(table: string) {
      const call: Call = { table, columns: '', filter: '' }
      const builder = {
        select(columns: string) {
          call.columns = columns
          return builder
        },
        or(filter: string) {
          call.filter = filter
          calls.push(call)
          return builder
        },
        in(_column: string, ids: string[]) {
          const index = nextPage.get(table) ?? 0
          nextPage.set(table, index + 1)
          const made: Call = { ...call, filter: `in:${ids.join(',')}` }
          calls.push(made)
          return {
            abortSignal(signal: AbortSignal) {
              made.signal = signal
              return Promise.resolve({ data: pages[table]?.[index] ?? [], error: null })
            },
          }
        },
        order() {
          return builder
        },
        limit() {
          const index = nextPage.get(table) ?? 0
          nextPage.set(table, index + 1)
          return {
            abortSignal(signal: AbortSignal) {
              call.signal = signal
              return Promise.resolve({ data: pages[table]?.[index] ?? [], error: null })
            },
          }
        },
      }
      return builder
    },
  }
  return { client: client as never, calls }
}

describe('peekRemoteChanges', () => {
  it('asks for ids and clocks, never document content', async () => {
    const { client, calls } = fakeSupabase({ decks: [[]] })

    await peekRemoteChanges(client, 'decks', null)

    expect(calls[0]?.columns).toBe('id,updated_at,deleted')
    expect(calls[0]?.columns).not.toContain('data')
  })

  it('reuses the pull filter, so the peek and the pull cannot disagree about "since"', async () => {
    const { client, calls } = fakeSupabase({ decks: [[]] })
    const checkpoint = { updated_at: '2026-01-01T00:00:00Z', id: 'd1' }

    await peekRemoteChanges(client, 'decks', checkpoint)

    expect(calls[0]?.filter).toBe(buildPullFilter(checkpoint))
  })

  it('starts from the epoch when the device has never synced', async () => {
    const { client, calls } = fakeSupabase({ decks: [[]] })

    await peekRemoteChanges(client, 'decks', null)

    expect(calls[0]?.filter).toBe(buildPullFilter(undefined))
  })

  it('reports a tombstone as a change, not as an absence', async () => {
    const { client } = fakeSupabase({
      decks: [[{ id: 'd1', updated_at: '2026-02-01T00:00:00Z', deleted: true }]],
    })

    await expect(peekRemoteChanges(client, 'decks', null)).resolves.toEqual([
      { id: 'd1', updated_at: '2026-02-01T00:00:00Z', deleted: true },
    ])
  })

  it('surfaces a PostgREST error rather than reporting an empty cloud', async () => {
    const client = {
      from: () => ({
        select: () => ({
          or: () => ({
            order: () => ({
              order: () => ({
                limit: () => ({
                  abortSignal: () => Promise.resolve({ data: null, error: { message: 'nope' } }),
                }),
              }),
            }),
          }),
        }),
      }),
    }

    await expect(peekRemoteChanges(client as never, 'decks', null)).rejects.toThrow('nope')
  })
})

describe('fetchRemoteDocuments', () => {
  it('asks in batches of a hundred ids, and hands the answers back as one list', async () => {
    const ids = Array.from({ length: 250 }, (_, i) => `d${i}`)
    const row = (id: string) => ({ id, data: { id }, deleted: false })
    const { client, calls } = fakeSupabase({
      decks: [ids.slice(0, 100).map(row), ids.slice(100, 200).map(row), ids.slice(200).map(row)],
    })

    const documents = await fetchRemoteDocuments(client, 'decks', ids)

    expect(calls).toHaveLength(3)
    expect(calls[0]?.filter.split(',')).toHaveLength(100)
    expect(calls[2]?.filter).toBe(`in:${ids.slice(200).join(',')}`)
    expect(documents.map((document) => document.id)).toEqual(ids)
  })

  it('bounds every request, so a hung one cannot hold a Sync forever', async () => {
    const { client, calls } = fakeSupabase({ decks: [[]] })
    await fetchRemoteDocuments(client, 'decks', ['d1'])
    await peekRemoteChanges(client, 'decks', null)
    expect(calls.every((call) => call.signal instanceof AbortSignal)).toBe(true)
  })

  it('asks for nothing when there are no ids', async () => {
    const { client, calls } = fakeSupabase({ decks: [[]] })

    await expect(fetchRemoteDocuments(client, 'decks', [])).resolves.toEqual([])
    expect(calls).toEqual([])
  })

  it('maps rows back to documents, carrying the tombstone flag', async () => {
    const { client } = fakeSupabase({
      decks: [[{ id: 'd1', data: { id: 'd1', name: 'Kanji' }, deleted: false }]],
    })

    await expect(fetchRemoteDocuments(client, 'decks', ['d1'])).resolves.toEqual([
      { id: 'd1', name: 'Kanji', _deleted: false },
    ])
  })
})

describe('fetchRemoteParents', () => {
  it('reads only the three parent fields out of the document, never the document itself', async () => {
    const { client, calls } = fakeSupabase({
      cards: [[{ id: 'c1', deckId: 'd1', parentId: null, folderId: null }]],
    })

    await expect(fetchRemoteParents(client, 'cards', ['c1'])).resolves.toEqual([
      { id: 'c1', deckId: 'd1', parentId: null, folderId: null },
    ])
    expect(calls[0]?.columns).toBe(
      'id,deckId:data->>deckId,parentId:data->>parentId,folderId:data->>folderId',
    )
  })

  it('asks for nothing when there are no ids', async () => {
    const { client, calls } = fakeSupabase({ cards: [[]] })

    await expect(fetchRemoteParents(client, 'cards', [])).resolves.toEqual([])
    expect(calls).toEqual([])
  })
})

describe('peek pagination', () => {
  it('keeps asking while a page comes back full', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({
      id: `d${i}`,
      updated_at: '2026-01-01T00:00:00Z',
      deleted: false,
    }))
    const { client, calls } = fakeSupabase({ decks: [full, []] })

    const changes = await peekRemoteChanges(client, 'decks', null)

    expect(changes).toHaveLength(1000)
    expect(calls).toHaveLength(2)
    expect(calls[1]?.filter).toContain('d999')
  })
})
