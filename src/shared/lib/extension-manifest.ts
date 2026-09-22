import type { ReactElement } from 'react'
import type { RxCollectionCreator } from 'rxdb'
import type { Identifiable, Repository } from '@/shared/api'
import type { SyncCadence } from '@/shared/config/sync-tables'
import type { DeckFilter, DeckOrder } from './deck-order'
import type { PendingChangePort } from './entity-store'
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
  /** The extension feature this row belongs to; switched off, the row is withdrawn. */
  feature?: string
}

/**
 * An order an extension adds to the Library's sort menu, under its own id (`bible:canon`). The
 * order itself is pure (`DeckOrder`); this carries how the menu names and draws it.
 */
export type DeckSortContribution = DeckOrder & {
  /** A key inside the extension's own namespace, like every contribution's copy. */
  labelKey: string
  icon: ReactElement
  /** The extension feature this order belongs to; switched off, the order is withdrawn. */
  feature?: string
}

/** A filter an extension adds to the Library's Show menu, under its own id (`bible:law`). */
export type DeckFilterContribution = DeckFilter & {
  labelKey: string
  icon: ReactElement
  feature?: string
}

/** Everything the enabled extensions are currently offering, merged. */
export interface ExtensionContributions {
  importOptions?: ImportOptionContribution[]
  deckSorts?: DeckSortContribution[]
  deckFilters?: DeckFilterContribution[]
}

export type ExtensionPoint = keyof ExtensionContributions

/** A screen an extension owns. Always lazy — extension UI must stay off the entry graph. */
export interface ExtensionRoute {
  path: string
  load: () => Promise<Record<string, unknown>>
  name: string
  validateSearch?: (search: Record<string, unknown>) => Record<string, unknown>
  /**
   * The extension feature this screen belongs to. Switched off, the route is not opened — the
   * learner lands on the extension's overview instead, where the switch is.
   */
  feature?: string
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
  extra: {
    validateSearch?: (search: Record<string, unknown>) => Record<string, unknown>
    feature?: string
  } = {},
): ExtensionRoute {
  return { path, load, name, ...extra }
}

/**
 * One switchable part of an extension: what it provides, in the learner's words, with a switch of
 * its own on the extension's overview. Switching one off withdraws its contributions and closes its
 * screens; it never deletes anything the learner made with it.
 */
export interface ExtensionFeature {
  id: string
  icon: ReactElement
  /** Keys inside the extension's own i18n namespace. */
  labelKey: string
  descriptionKey: string
}

/** What an extension is handed when it is switched on. */
export interface ExtensionContext {
  /** The repository built for a collection its manifest declared, by the key it declared. */
  repository: <T extends Identifiable>(key: string) => Repository<T>
  /**
   * The pending-change port for one of its collections, so its writes wait for a Sync like every
   * core write. A collection that never leaves the device gets a port that logs nothing.
   */
  pending: (key: string) => PendingChangePort
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
  /**
   * How its changes leave the device. Defaults to `held`: an extension holds a learner's content
   * until it says otherwise, the way the four content collections do.
   */
  cadence?: SyncCadence
  /** Names the table to a learner on the Sync page — a key in the extension's namespace. */
  labelKey?: string
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
   * The parts of itself a learner may switch off one at a time. Declaring none means the extension
   * is all or nothing, which is what its own switch already says.
   */
  features?: ExtensionFeature[]
  /**
   * Its overview screen, if it has one: an ordinary screen of its own, which the Extensions page
   * links to under the extension's label while it is enabled. It says what the extension is, what
   * it provides, and holds the switches for its features. Gated like every other route of its — on
   * the extension being active.
   */
  overview?: { route: ExtensionRoute }
}
