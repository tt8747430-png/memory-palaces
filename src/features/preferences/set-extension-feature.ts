import type { ExtensionId } from '@/shared/lib'
import {
  type Preferences,
  type PreferencesStore,
  withExtensionFeature,
} from '@/entities/preferences'
import { setPreferences } from './set-preferences'

/**
 * Switches one of an Extension's features on or off. The stored map names what is **off**, so a
 * feature nobody has touched needs no entry, and an id from a newer build is carried through
 * untouched — dropping it would switch a feature back on behind the learner's back.
 */
export async function setExtensionFeature(
  store: PreferencesStore,
  extensionId: ExtensionId,
  featureId: string,
  on: boolean,
  now: number = Date.now(),
): Promise<Preferences> {
  return setPreferences(
    store,
    { disabledFeatures: (current) => withExtensionFeature(current, extensionId, featureId, on) },
    now,
  )
}
