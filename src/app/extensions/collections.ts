import type { ExtensionCollectionSpec, ExtensionManifest } from '@/shared/lib'
import type { SyncTableSpec } from '@/shared/config/sync-tables'

export interface LoadedExtensionCollections {
  specs: ExtensionCollectionSpec[]
  /**
   * The ones that replicate, each carrying the extension that owns it — a table name is not a
   * collection key, and which extension owns it is what lets replication follow its toggle.
   */
  syncTables: SyncTableSpec[]
}

/**
 * Awaited once in `createServices`, before the database is built. Two call sites need this list
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
  return {
    specs: loaded.flatMap((entry) => entry.specs),
    syncTables: loaded.flatMap((entry) =>
      entry.specs.flatMap((spec) =>
        spec.table
          ? [
              {
                table: spec.table,
                collectionKey: spec.key,
                owner: entry.id,
                cadence: spec.cadence ?? 'held',
                labelKey: spec.labelKey,
              },
            ]
          : [],
      ),
    ),
  }
}
