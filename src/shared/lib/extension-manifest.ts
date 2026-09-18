import type { ReactNode } from 'react'
import type { RxCollectionCreator } from 'rxdb'
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
  icon: ReactNode
  /** Keys inside the extension's own i18n namespace. */
  labelKey: string
  descriptionKey: string
  namespace: string
  loadMessages: () => Promise<Record<string, unknown>>
  routes: ExtensionRoute[]
  /**
   * Lazy, like everything else here: the schemas are awaited in `createServices` before the
   * database is built, so an extension's schema never reaches the entry graph.
   */
  loadCollections?: () => Promise<ExtensionCollectionSpec[]>
  contributions: ExtensionContributions
  /** The route of its detail screen, if it has one. The Extensions page links to it by path. */
  detailPath?: string
  /** Mounted only while the extension is enabled — this is where its stores and keepers live. */
  loadProvider?: () => Promise<{
    ExtensionProvider: (props: { children: ReactNode }) => ReactNode
  }>
}
