import 'fake-indexeddb/auto'
import type { RxJsonSchema } from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { describe, expect, it } from 'vitest'
import type { Identifiable } from '@/shared/data'
import { openRxdbCollection } from './rxdb-collection'
import { RxdbRepository } from './rxdb-repository'

interface Thing extends Identifiable {
  value: number
}

const thingSchema: RxJsonSchema<Thing> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    value: { type: 'number' },
  },
  required: ['id', 'value'],
}

describe('RxdbRepository persistence (Dexie / IndexedDB)', () => {
  it('keeps saved entities after the database is closed and reopened (survives a reload)', async () => {
    const databaseName = `mindscape-persist-${crypto.randomUUID()}`
    const open = () =>
      openRxdbCollection({
        databaseName,
        collectionName: 'things',
        schema: thingSchema,
        storage: getRxStorageDexie(),
      })

    const first = await open()
    await new RxdbRepository<Thing>(first.collection).save({ id: 'a', value: 42 })
    await first.database.close()

    const second = await open()
    const reloaded = new RxdbRepository<Thing>(second.collection)
    expect(await reloaded.getById('a')).toEqual({ id: 'a', value: 42 })

    await second.database.remove()
  })
})
