import type { ExtensionCollectionSpec, ExtensionId, ExtensionManifest } from '@/shared/lib'
import type { SyncTableSpec } from '@/shared/config/sync-tables'

export interface LoadedExtensionCollections {
  specs: ExtensionCollectionSpec[]
  /** The ones that replicate, as `{ table, collectionKey }` — a table name is not a collection key. */
  syncTables: SyncTableSpec[]
  /** Which extension owns a table, so replication can follow its toggle. */
  ownerOf: ReadonlyMap<string, ExtensionId>
}

/**
 * Awaited once in `createServices`, before the database is built. Three call sites need this list
 * and each would otherwise derive it with its own `flatMap`; deriving it here is what keeps them
 * equal.
 */
export async function loadExtensionCollections(
  manifests: readonly ExtensionManifest[],
): Promise<LoadedExtensionCollections> {
  const loaded = await Promise.all(
    manifests.map(async (manifest) => ({
      id: manifest.id,
      specs: (await manifest.loadCollections?.()) ?? [],
    })),
  )
  const specs = loaded.flatMap((entry) => entry.specs)
  const syncTables = specs.flatMap((spec) =>
    spec.table ? [{ table: spec.table, collectionKey: spec.key }] : [],
  )
  const ownerOf = new Map(
    loaded.flatMap((entry) =>
      entry.specs.flatMap((spec) => (spec.table ? [[spec.table, entry.id] as const] : [])),
    ),
  )
  return { specs, syncTables, ownerOf }
}
