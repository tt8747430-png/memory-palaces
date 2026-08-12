import type { AppCollections } from './database'

export interface ResetLocalDatabaseDeps {
  collections: Promise<AppCollections>
  /** Injected for tests; the reload is what rebuilds every store against the empty database. */
  location?: Pick<Location, 'reload'>
}

/**
 * Wipes the on-device database and reloads.
 *
 * Only a switch to a *different* account gets here. Reloading is deliberate rather than lazy: the
 * composition root wires stores, repositories and replication to collections that no longer exist,
 * and rebuilding all of that in place would be far more fragile than starting the app again.
 */
export async function resetLocalDatabase({
  collections,
  location = window.location,
}: ResetLocalDatabaseDeps): Promise<void> {
  const { decks } = await collections
  await decks.database.remove()
  location.reload()
}
