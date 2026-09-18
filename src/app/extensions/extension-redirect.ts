import { ROUTES } from '@/shared/config/routes'
import type { ExtensionId } from '@/shared/lib'

export interface ExtensionRedirect {
  to: string
  search: { highlight: ExtensionId }
}

/** Settings → Extensions, with the extension's row marked so the learner sees which one it was. */
export function extensionSettings(id: ExtensionId): ExtensionRedirect {
  return { to: ROUTES.settingsExtensions, search: { highlight: id } }
}

/**
 * Where an extension route sends the learner, or null to let it render: never a blank 404, never a
 * silent redirect home.
 *
 * `active` must be read once the runtime has settled on loaded preferences — an unloaded store is
 * not "off", and deciding on one bounces a cold deep link to an enabled extension.
 */
export function extensionRedirect(id: ExtensionId, active: boolean): ExtensionRedirect | null {
  return active ? null : extensionSettings(id)
}
