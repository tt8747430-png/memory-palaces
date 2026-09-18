import type { ExtensionCollectionSpec, ExtensionManifest } from '@/shared/lib'

/**
 * Awaited once in `createServices`, before the database is built. The manifests stay in the entry
 * graph; the schemas they name do not, so resolving them is what pulls them in.
 */
export async function loadExtensionCollections(
  manifests: readonly ExtensionManifest[],
): Promise<ExtensionCollectionSpec[]> {
  const loaded = await Promise.all(manifests.map((manifest) => manifest.loadCollections?.() ?? []))
  return loaded.flat()
}
