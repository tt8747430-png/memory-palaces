import type { ExtensionId } from '@/shared/lib'
import { type Preferences, type PreferencesStore } from '@/entities/preferences'
import { setPreferences } from './set-preferences'

/**
 * Adds or removes one id. Every other id is carried through untouched, including ones
 * this build does not recognise — dropping those would switch off an extension a newer
 * build enabled on another device.
 */
export async function setExtensionEnabled(
  store: PreferencesStore,
  id: ExtensionId,
  enabled: boolean,
  now: number = Date.now(),
): Promise<Preferences> {
  return setPreferences(
    store,
    {
      extensions: (current) =>
        enabled
          ? current.includes(id)
            ? [...current]
            : [...current, id]
          : current.filter((held) => held !== id),
    },
    now,
  )
}
