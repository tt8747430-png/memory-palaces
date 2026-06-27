import type { RxJsonSchema } from 'rxdb'
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory'
import { runRepositoryContract } from '@/shared/test/repository-contract'
import type { Identifiable } from '@/shared/api'
import { openRxdbCollection } from './database'
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

// The RxDB adapter must pass the exact same contract as the in-memory adapter
// (Liskov) — proven here on the memory storage so the suite stays fast and isolated.
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
