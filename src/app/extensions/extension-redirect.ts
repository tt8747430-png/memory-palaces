import { ROUTES } from '@/shared/config/routes'
import type { ExtensionId } from '@/shared/lib'
import { isExtensionEnabled, type Preferences } from '@/entities/preferences'

export interface ExtensionRedirect {
  to: string
  search: { highlight: ExtensionId }
}

/**
 * Where an extension route sends the reader, or null to let it render.
 *
 * `preferences` must be the value read **after** the store is ready — `undefined` here means
 * "there are none stored", never "not loaded yet". Deciding on an unloaded store sends a cold deep
 * link to Settings with the extension switched on, which is the silent redirect the design forbids.
 */
export function extensionRedirect(
  preferences: Preferences | null | undefined,
  id: ExtensionId,
): ExtensionRedirect | null {
  if (preferences && isExtensionEnabled(preferences, id)) return null
  return { to: ROUTES.settingsExtensions, search: { highlight: id } }
}
