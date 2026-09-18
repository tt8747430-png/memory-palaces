import type { ReactElement } from 'react'
import type { RxCollectionCreator } from 'rxdb'
import type { Identifiable, Repository } from '@/shared/api'
import type { TransferOption } from '@/shared/ui'

/**
 * The id an extension is known by, in the registry and in `preferences.extensions`.
 *
 * A plain alias on purpose: the set is open, and `completePreferences` has to round-trip an id
 * a newer build enabled on another device. A closed union would delete it.
 */
export type ExtensionId = string

/**
 * A row an extension adds to the import sheet. It carries **keys, not copy** — resolved by the
 * host against the extension's own namespace — so no English ever lives in a manifest.
 * `to` is a route path. The rest is the row shape `TransferSheet` already renders, so the two
 * cannot drift.
 */
export type ImportOptionContribution = Omit<TransferOption, 'onSelect' | 'title' | 'subtitle'> & {
  titleKey: string
  subtitleKey: string
  to: string
}

/** Everything the enabled extensions are currently offering, merged. */
export interface ExtensionContributions {
  importOptions?: ImportOptionContribution[]
}

export type ExtensionPoint = keyof ExtensionContributions

/** A screen an extension owns. Always lazy — extension UI must stay off the entry graph. */
export interface ExtensionRoute {
  path: string
  load: () => Promise<Record<string, unknown>>
  name: string
  validateSearch?: (search: Record<string, unknown>) => Record<string, unknown>
}

/**
 * Declares one, binding `name` to what the module actually exports. Call this instead of writing
 * the object literal: the stored shape has to forget the module's type, and this is where the
 * check happens while it is still available.
 */
export function extensionRoute<Exports extends Record<string, unknown>>(
  path: string,
  load: () => Promise<Exports>,
  name: keyof Exports & string,
  validateSearch?: (search: Record<string, unknown>) => Record<string, unknown>,
): ExtensionRoute {
  return { path, load, name, validateSearch }
}

/** What an extension is handed when it is switched on. */
export interface ExtensionContext {
  /** The repository built for a collection its manifest declared, by the key it declared. */
  repository: <T extends Identifiable>(key: string) => Repository<T>
}

/**
 * What switching an extension on produced: the services its own screens read, and how to stop
 * them. `deactivate` is the whole of "backend off" — every store and keeper `activate` started, it
 * stops.
 */
export interface ExtensionActivation<Services = unknown> {
  services: Services
  deactivate: () => void
}

/** The extension's composition root, loaded behind the splash and called when it is switched on. */
export interface ExtensionRuntimeModule {
  activate: (context: ExtensionContext) => ExtensionActivation
}

/**
 * An RxDB collection an extension owns. `table` names its Supabase table, or is null
 * when the collection never leaves the device.
 */
export interface ExtensionCollectionSpec {
  key: string
  table: string | null
  creator: RxCollectionCreator
}

export interface ExtensionManifest {
  id: ExtensionId
  /** An element, not a node: the Extensions row always has a tile to fill, so null is not an icon. */
  icon: ReactElement
  /** Keys inside the extension's own i18n namespace. */
  labelKey: string
  descriptionKey: string
  namespace: string
  /** Loaded behind the splash for every registered extension: Settings names them all, on or off. */
  loadMessages: () => Promise<Record<string, unknown>>
  routes: ExtensionRoute[]
  /**
   * Lazy, like everything else here: the schemas are awaited in `createServices` before the
   * database is built, so an extension's schema never reaches the entry graph.
   */
  loadCollections?: () => Promise<ExtensionCollectionSpec[]>
  /**
   * Loaded behind the splash with its messages, on or off: switching it on then activates it at
   * once, so no screen of its renders before the stores it reads exist.
   */
  loadRuntime: () => Promise<ExtensionRuntimeModule>
  contributions: ExtensionContributions
  /**
   * Its settings screen, if it has one: an ordinary screen of its own, which the Extensions page
   * links to under the extension's label while it is enabled. Gated like every other route of
   * its — on the extension being active, and nothing else.
   */
  settings?: { route: ExtensionRoute }
}
