import { createContext, use } from 'react'
import type { ExtensionId } from './extension-manifest'

/**
 * The services each active extension's `activate` published, by id. An extension is active exactly
 * while it is in here — the app reads this one map to decide, so no surface can disagree with
 * another about it.
 */
export type ActiveExtensions = Readonly<Record<ExtensionId, unknown>>

const NONE: ActiveExtensions = {}

export const ExtensionServicesContext = createContext<ActiveExtensions>(NONE)

export function isExtensionActive(active: ActiveExtensions, id: ExtensionId): boolean {
  return Object.hasOwn(active, id)
}

/**
 * The extension knows its services' type and `app` cannot, so exactly one cast exists and it lives
 * here rather than at every call site. Its screens render only while it is active — the router
 * gates them — so a missing entry is a bug, and says so.
 */
export function useExtensionServices<Services>(id: ExtensionId): Services {
  const active = use(ExtensionServicesContext)
  if (!isExtensionActive(active, id)) throw new Error(`The ${id} extension is not active`)
  return active[id] as Services
}
