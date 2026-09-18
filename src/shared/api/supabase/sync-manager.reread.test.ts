// @vitest-environment node
import 'fake-indexeddb/auto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createRxDatabase, type RxCollection, type RxDatabase, type RxJsonSchema } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { afterEach, describe, expect, it } from 'vitest'
import type { Identifiable } from '@/shared/api'
import { mergeAgainstBase } from '@/shared/api/rxdb'
import type { PushRow, Row } from './document-mapping'
import { createCollectionReplication } from './replication'
import { SyncManager } from './sync-manager'

interface Note extends Identifiable {
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

const schema: RxJsonSchema<Note> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    title: { type: 'string' },
    body: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
  required: ['id', 'title', 'body', 'createdAt', 'updatedAt'],
}

const TABLE = 'decks'
const USER = 'u1'

/**
 * One table of the cloud, keeping `push_documents`' rule and the pull's `(updated_at, id)` order —
 * just enough PostgREST for `createCollectionReplication` to talk to it.
 */
function fakeCloud() {
  const rows = new Map<string, Required<Row>>()
  let tick = 0
  const stamp = () => `2026-01-01T00:00:00.${String(++tick).padStart(3, '0')}Z`

  const accepts = (held: Required<Row> | undefined, row: PushRow & { base_deleted?: boolean }) => {
    if (!held) return true
    if (JSON.stringify(held.data) === JSON.stringify(row.data) && held.deleted === row.deleted) {
      return true
    }
    return held.data.updatedAt === row.base && held.deleted === (row.base_deleted ?? held.deleted)
  }

  const push = (incoming: PushRow[]): Row[] =>
    incoming.flatMap((row) => {
      const held = rows.get(row.id)
      if (!accepts(held, row)) return held ? [held] : []
      rows.set(row.id, { id: row.id, data: row.data, deleted: row.deleted, updated_at: stamp() })
      return []
    })

  const since = (filter: string): { at: string; id: string | null } => {
    const [, at = '', id = null] =
      /updated_at\.gt\."([^"]+)"(?:,and\(updated_at\.eq\."[^"]+",id\.gt\."([^"]+)"\))?/.exec(
        filter,
      ) ?? []
    return { at, id }
  }

  const pull = (filter: string, limit: number): Row[] => {
    const from = since(filter)
    return [...rows.values()]
      .filter(
        (row) =>
          row.updated_at > from.at ||
          (row.updated_at === from.at && from.id !== null && row.id > from.id),
      )
      .sort((a, b) => a.updated_at.localeCompare(b.updated_at) || a.id.localeCompare(b.id))
      .slice(0, limit)
  }

  const answer = <T>(data: T) => ({ abortSignal: async () => ({ data, error: null }) })

  const client = {
    rpc: (_name: string, args: { p_rows: PushRow[] }) => answer(push(args.p_rows)),
    from: () => {
      let filter = ''
      const query = {
        select: () => query,
        or: (value: string) => {
          filter = value
          return query
        },
        order: () => query,
        limit: (count: number) => answer(pull(filter, count)),
      }
      return query
    },
  } as unknown as SupabaseClient

  return {
    client,
    get: (id: string) => rows.get(id),
    /** Another device's push, based on the copy it saw. */
    pushAs: (note: Note, base: string) =>
      push([
        {
          id: note.id,
          user_id: USER,
          data: { ...note },
          deleted: false,
          base,
          base_deleted: false,
        },
      ]),
    /**
     * A row whose `updated_at` lands behind a checkpoint already handed out — what a transaction
     * that committed after a later one looks like to the pull.
     */
    insertBehind: (note: Note) =>
      rows.set(note.id, {
        id: note.id,
        data: { ...note },
        deleted: false,
        updated_at: '2026-01-01T00:00:00.000Z',
      }),
  }
}

const databases: RxDatabase[] = []

async function device(cloud: ReturnType<typeof fakeCloud>) {
  const database = await createRxDatabase({
    name: `reread-${crypto.randomUUID()}`,
    storage: getRxStorageDexie(),
  })
  databases.push(database)
  const { notes } = await database.addCollections({
    notes: { schema, conflictHandler: mergeAgainstBase<Note>() },
  })
  const collection = notes as RxCollection<Note>
  const manager = new SyncManager(
    [{ table: TABLE, collection: collection as unknown as RxCollection<Identifiable> }],
    (userId, target, { onPushed, fromStart }) =>
      createCollectionReplication({
        supabase: cloud.client,
        userId,
        table: target.table,
        collection: target.collection,
        onPushed,
        fromStart,
      }),
  )
  await manager.start(USER, [TABLE])
  const read = async (id: string) => (await collection.findOne(id).exec())?.toJSON()
  return { collection, manager, read }
}

const note = (over: Partial<Note> = {}): Note => ({
  id: 'n1',
  title: 'Romans 8',
  body: 'old text',
  createdAt: 't0',
  updatedAt: 't1',
  ...over,
})

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.remove()))
})

describe('SyncManager.rereadEverything — reading the whole cloud again', () => {
  it('still merges a change waiting here field by field against the copy it was based on', async () => {
    const cloud = fakeCloud()
    cloud.pushAs(note(), 'none')
    const phone = await device(cloud)
    await phone.manager.runCycle()

    // The tablet fixes the text; the phone, which has not pulled since, renames the note.
    cloud.pushAs(note({ body: 'fixed text', updatedAt: 't3' }), 't1')
    await phone.collection.upsert(note({ title: 'Romans 8:1', updatedAt: 't2' }))

    await phone.manager.rereadEverything()
    await phone.manager.runCycle()

    expect(cloud.get('n1')?.data).toMatchObject({ title: 'Romans 8:1', body: 'fixed text' })
    expect(await phone.read('n1')).toMatchObject({ title: 'Romans 8:1', body: 'fixed text' })
  })

  it('picks up a row the checkpoint had already stepped past', async () => {
    const cloud = fakeCloud()
    cloud.pushAs(note(), 'none')
    const phone = await device(cloud)
    await phone.manager.runCycle()

    cloud.insertBehind(note({ id: 'n2', title: 'Late' }))
    await phone.manager.runCycle()
    expect(await phone.read('n2')).toBeUndefined()

    await phone.manager.rereadEverything()
    await phone.manager.runCycle()

    expect(await phone.read('n2')).toMatchObject({ title: 'Late' })
  })
})
