import type { Identifiable, Repository } from '@/shared/api'
import { RxdbRepository } from '@/shared/api/rxdb'
import type { ExtensionCollectionSpec } from '@/shared/lib'
import { type AppCollections, collectionByKey } from '../persistence/database'

/** The repositories built for the extensions' collections, keyed as their manifests named them. */
export type ExtensionRepositories = Readonly<Record<string, Repository<Identifiable>>>

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
      new RxdbRepository<Identifiable>(collections.then((held) => collectionByKey(held, spec.key))),
    ]),
  )
}
