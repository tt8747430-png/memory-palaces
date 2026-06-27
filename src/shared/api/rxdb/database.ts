import type { RxCollection, RxDatabase, RxJsonSchema, RxStorage } from 'rxdb'
import { createRxDatabase } from 'rxdb'
import type { Identifiable } from '../base-repository'

export interface OpenRxdbCollectionConfig<
  T extends Identifiable,
  Internals,
  InstanceCreationOptions,
> {
  databaseName: string
  collectionName: string
  schema: RxJsonSchema<T>
  /** Injected so the same adapter runs on Dexie/IndexedDB (browser) or memory (tests). */
  storage: RxStorage<Internals, InstanceCreationOptions>
}

/**
 * Open (or create) an RxDB database holding a single collection and hand back the
 * collection plus the database handle (the caller closes/removes it on teardown).
 * Entity-shaped `T` is inferred from `schema`, so this stays generic and the
 * composition root remains the only place that names concrete collections.
 */
export async function openRxdbCollection<
  T extends Identifiable,
  Internals,
  InstanceCreationOptions,
>(
  config: OpenRxdbCollectionConfig<T, Internals, InstanceCreationOptions>,
): Promise<{ database: RxDatabase; collection: RxCollection<T> }> {
  const database = await createRxDatabase({
    name: config.databaseName,
    storage: config.storage,
  })
  const collections = await database.addCollections({
    [config.collectionName]: { schema: config.schema },
  })
  return { database, collection: collections[config.collectionName] as RxCollection<T> }
}
