import type { RxCollection } from 'rxdb'
import type { Identifiable } from '@/shared/api'
import { RxdbRepository } from '@/shared/api/rxdb'
import type { ExtensionCollectionSpec, ExtensionRepositories } from '@/shared/lib'
import type { AppCollections } from '../persistence/database'

/**
 * One repository per declared collection, keyed as the manifest named it. Takes the database as a
 * promise and keeps it one: `RxdbRepository` resolves it lazily, so `createServices` never blocks.
 */
export function buildExtensionRepositories(
  specs: readonly ExtensionCollectionSpec[],
  collections: Promise<AppCollections>,
): ExtensionRepositories {
  return Object.fromEntries(
    specs.map((spec) => [
      spec.key,
      new RxdbRepository<Identifiable>(
        collections.then(
          (held) => (held as unknown as Record<string, RxCollection<Identifiable>>)[spec.key]!,
        ),
      ),
    ]),
  )
}
