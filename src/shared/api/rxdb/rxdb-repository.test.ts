import { describe, expect, it } from 'vitest'
import type { RxJsonSchema } from 'rxdb'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { runRepositoryContract } from '@/shared/test/repository-contract'
import type { Identifiable } from '@/shared/api'
import { openRxdbCollection } from './database'
import { RxdbRepository } from './rxdb-repository'

interface Thing extends Identifiable {
  value: number
}

interface ClockedThing extends Identifiable {
  updatedAt: string
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

runRepositoryContract<Thing>(
  'RxdbRepository (memory storage)',
  () =>
    new RxdbRepository<Thing>(
      openRxdbCollection({
        databaseName: `mindscape-test-${crypto.randomUUID()}`,
        collectionName: 'things',
        schema: thingSchema,
        storage: getRxStorageMemory(),
      }).then((opened) => opened.collection),
    ),
  (id) => ({ id, value: 1 }),
)

const clockedThingSchema: RxJsonSchema<ClockedThing> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    updatedAt: { type: 'string' },
    value: { type: 'number' },
  },
  required: ['id', 'updatedAt', 'value'],
}

describe('RxdbRepository tombstones', () => {
  it('dates the delete, so a stale edit cannot outlive it and resurrect the document', async () => {
    const { collection } = await openRxdbCollection({
      databaseName: `mindscape-test-${crypto.randomUUID()}`,
      collectionName: 'clocked',
      schema: clockedThingSchema,
      storage: getRxStorageMemory(),
    })
    const repo = new RxdbRepository<ClockedThing>(collection)

    await repo.save({ id: 'a', updatedAt: '2020-01-01T00:00:00.000Z', value: 1 })
    await repo.remove('a')

    const [tombstone] = await collection.storageInstance.findDocumentsById(['a'], true)
    expect(tombstone?._deleted).toBe(true)
    expect(tombstone?.updatedAt.localeCompare('2020-01-01T00:00:00.000Z')).toBe(1)
  })

  it('removes documents from a clockless collection unchanged', async () => {
    const { collection } = await openRxdbCollection({
      databaseName: `mindscape-test-${crypto.randomUUID()}`,
      collectionName: 'things',
      schema: thingSchema,
      storage: getRxStorageMemory(),
    })
    const repo = new RxdbRepository<Thing>(collection)

    await repo.save({ id: 'a', value: 1 })
    await repo.remove('a')

    expect(await repo.getById('a')).toBeNull()
  })
})
