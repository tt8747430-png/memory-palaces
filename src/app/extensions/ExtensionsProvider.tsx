import { type ReactNode, useMemo } from 'react'
import { useStore } from 'zustand'
import {
  type ActiveExtensions,
  type ExtensionContributions,
  type ExtensionManifest,
  ExtensionPointsContext,
  ExtensionServicesContext,
  isExtensionActive,
} from '@/shared/lib'
import type { ExtensionRuntime } from './extension-runtime'

function mergeContributions(
  manifests: readonly ExtensionManifest[],
  active: ActiveExtensions,
): ExtensionContributions {
  return {
    importOptions: manifests
      .filter((manifest) => isExtensionActive(active, manifest.id))
      .flatMap((manifest) => manifest.contributions.importOptions ?? []),
  }
}

/**
 * Hands React what the runtime decided: each active extension's services, and what it contributes
 * to core surfaces. Both are context values over a tree whose shape never changes — toggling an
 * extension re-renders its readers and remounts nothing.
 */
export function ExtensionsProvider({
  runtime,
  children,
}: {
  runtime: ExtensionRuntime
  children: ReactNode
}) {
  const active = useStore(runtime.store, (state) => state.active)
  const contributions = useMemo(
    () => mergeContributions(runtime.manifests, active),
    [runtime, active],
  )
  return (
    <ExtensionServicesContext value={active}>
      <ExtensionPointsContext value={contributions}>{children}</ExtensionPointsContext>
    </ExtensionServicesContext>
  )
}
