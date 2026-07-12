import type { RxCollection, RxDatabase, RxJsonSchema, RxStorage } from 'rxdb'
import { createRxDatabase } from 'rxdb'
import type { Identifiable } from '@/shared/api'

export interface OpenRxdbCollectionConfig<
  T extends Identifiable,
  Internals,
  InstanceCreationOptions,
> {
  databaseName: string
  collectionName: string
  schema: RxJsonSchema<T>
  storage: RxStorage<Internals, InstanceCreationOptions>
}

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
