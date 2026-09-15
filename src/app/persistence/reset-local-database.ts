import type { AppCollections } from './database'

export interface ResetLocalDatabaseDeps {
  collections: Promise<AppCollections>
  location?: Pick<Location, 'reload'>
}

export async function resetLocalDatabase({
  collections,
  location = window.location,
}: ResetLocalDatabaseDeps): Promise<void> {
  const { decks } = await collections
  await decks.database.remove()
  location.reload()
}
