import { createContext, use } from 'react'
import type { Identifiable, Repository } from '@/shared/api'

/**
 * The repositories the composition root built for the enabled extensions, keyed as their
 * manifests named their collections.
 *
 * Repositories, not collections: `RxdbRepository` already takes a `Promise<RxCollection>`, so
 * handing these over costs no `await` in `createServices` — the database stays the lazy promise
 * every core repo is built from.
 */
export type ExtensionRepositories = Record<string, Repository<Identifiable>>

const EMPTY: ExtensionRepositories = {}

export const ExtensionRepositoriesContext = createContext<ExtensionRepositories>(EMPTY)

/**
 * The extension knows its entity type and `app` cannot, so exactly one cast exists and it lives
 * here rather than at every call site.
 */
export function useExtensionRepository<T extends Identifiable>(key: string): Repository<T> {
  const held = use(ExtensionRepositoriesContext)[key]
  if (!held) throw new Error(`No repository was provided for the extension collection ${key}`)
  return held as Repository<T>
}
