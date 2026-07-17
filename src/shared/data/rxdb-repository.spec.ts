import type { RxJsonSchema } from 'rxdb'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { runRepositoryContract } from './repository-contract'
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
