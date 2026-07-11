import type { AppDataBundle, TransferStores } from './export-progress'

/** Thrown when the imported text isn't a Mindscape export, so the page can show a
 * clear toast rather than a stack trace. */
export class InvalidImportError extends Error {
  constructor() {
    super('Not a valid Mindscape export.')
    this.name = 'InvalidImportError'
  }
}

/** Command — restore a previously exported bundle, upserting every record. Existing
 * records with the same id are overwritten (last-write-wins). */
export async function importProgress(json: string, stores: TransferStores): Promise<void> {
  const bundle = parseBundle(json)
  for (const folder of bundle.folders) await stores.folderStore.getState().save(folder)
  for (const deck of bundle.decks) await stores.deckStore.getState().save(deck)
  for (const card of bundle.cards) await stores.cardStore.getState().save(card)
  for (const question of bundle.questions) await stores.questionStore.getState().save(question)
  for (const notification of bundle.notifications) {
    await stores.notificationStore.getState().save(notification)
  }
  if (bundle.progress) await stores.progressStore.getState().save(bundle.progress)
  if (bundle.preferences) await stores.preferencesStore.getState().save(bundle.preferences)
  if (bundle.profile) await stores.profileStore.getState().save(bundle.profile)
}

function parseBundle(json: string): AppDataBundle {
  let raw: unknown
  try {
    raw = JSON.parse(json) as unknown
  } catch {
    throw new InvalidImportError()
  }
  if (!isBundle(raw)) throw new InvalidImportError()
  return raw
}

function isBundle(value: unknown): value is AppDataBundle {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.version === 'number' &&
    Array.isArray(v.folders) &&
    Array.isArray(v.decks) &&
    Array.isArray(v.cards) &&
    Array.isArray(v.questions) &&
    Array.isArray(v.notifications)
  )
}
