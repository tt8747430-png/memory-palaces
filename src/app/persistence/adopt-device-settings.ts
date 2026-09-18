import { whenStoreReady } from '@/shared/lib'
import type { PreferencesChanges, PreferencesStore } from '@/entities/preferences'
import { setPreferences } from '@/features/preferences'

/** Where settings that now follow the account used to live on the device. */
export const LEGACY_SETTING_KEYS = {
  devMode: 'mindscape.dev-mode',
  libraryExpanded: 'mindscape.library.expanded',
} as const

/**
 * Left by `sync-state`'s migration when it drops Autosync from a device that had it switched off —
 * that migration cannot write Preferences, and once the field is gone nothing else can read it.
 */
export const AUTOSYNC_OFF_HANDOFF_KEY = 'mindscape.autosync-off'

const KEYS = [...Object.values(LEGACY_SETTING_KEYS), AUTOSYNC_OFF_HANDOFF_KEY]

function readIds(raw: string): string[] | undefined {
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : undefined
  } catch {
    return undefined
  }
}

function heldChanges(): PreferencesChanges {
  const changes: PreferencesChanges = {}
  if (localStorage.getItem(LEGACY_SETTING_KEYS.devMode) === '1') changes.devMode = true
  if (localStorage.getItem(AUTOSYNC_OFF_HANDOFF_KEY) === '1') changes.autosync = false
  const expanded = localStorage.getItem(LEGACY_SETTING_KEYS.libraryExpanded)
  const ids = expanded === null ? undefined : readIds(expanded)
  if (ids?.length) changes.libraryExpanded = ids
  return changes
}

/**
 * Moves the settings this device used to keep to itself into Preferences, once, so switching them
 * to follow the account costs nobody a choice already made. A migration alone would not do: it runs
 * only on a document that exists, and a device that never changed a setting stored none —
 * `setPreferences` creates it. The old keys go only once the write has landed, so a failed write is
 * retried on the next launch. Awaited at boot, so the first screen already reads the moved values;
 * with nothing to move it returns at once, without waiting on the database.
 */
export async function adoptDeviceSettings(store: PreferencesStore): Promise<void> {
  if (KEYS.every((key) => localStorage.getItem(key) === null)) return
  await whenStoreReady(store)
  const changes = heldChanges()
  if (Object.keys(changes).length > 0) await setPreferences(store, changes)
  for (const key of KEYS) localStorage.removeItem(key)
}
