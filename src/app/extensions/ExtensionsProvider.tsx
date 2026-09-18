import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { i18n } from '@/shared/i18n'
import {
  type ExtensionContributions,
  type ExtensionId,
  type ExtensionManifest,
  ExtensionPointsContext,
} from '@/shared/lib'
import { isExtensionEnabled, usePreferencesStore } from '@/entities/preferences'

function mergeContributions(manifests: ExtensionManifest[]): ExtensionContributions {
  return {
    importOptions: manifests.flatMap((manifest) => manifest.contributions.importOptions ?? []),
  }
}

/**
 * Mounts one enabled extension: its messages first, then its own provider, which is where its
 * stores and keepers live. Unmounting is the whole of disabling — React tears the provider down,
 * and the namespace goes with it.
 */
function MountedExtension({
  manifest,
  onReady,
  children,
}: {
  manifest: ExtensionManifest
  onReady: (id: ExtensionId) => void
  children: ReactNode
}) {
  const [Provider, setProvider] = useState<((props: { children: ReactNode }) => ReactNode) | null>(
    null,
  )

  useEffect(() => {
    let live = true
    void manifest.loadMessages().then((messages) => {
      if (!live) return
      i18n.addResourceBundle('en', manifest.namespace, messages, true, false)
      onReady(manifest.id)
    })
    if (manifest.loadProvider) {
      void manifest.loadProvider().then((module) => {
        if (live) setProvider(() => module.ExtensionProvider)
      })
    }
    return () => {
      live = false
      i18n.removeResourceBundle('en', manifest.namespace)
    }
  }, [manifest, onReady])

  return Provider ? <Provider>{children}</Provider> : children
}

export function ExtensionsProvider({
  manifests,
  children,
}: {
  manifests: ExtensionManifest[]
  children: ReactNode
}) {
  // The stored array's identity only changes when preferences do, so this is a stable snapshot —
  // no serialising the ids to compare them, which would break on an id containing a comma.
  const enabledIds = usePreferencesStore((state) => state.preferences?.extensions)

  const enabled = useMemo(
    () =>
      manifests.filter((manifest) =>
        enabledIds ? isExtensionEnabled({ extensions: enabledIds }, manifest.id) : false,
      ),
    [manifests, enabledIds],
  )

  // Contributions are published only once the namespace is in, so a host never paints a raw key.
  const [ready, setReady] = useState<readonly ExtensionId[]>([])
  const onReady = useCallback(
    (id: ExtensionId) => setReady((held) => (held.includes(id) ? held : [...held, id])),
    [],
  )

  const contributions = useMemo(
    () => mergeContributions(enabled.filter((manifest) => ready.includes(manifest.id))),
    [enabled, ready],
  )

  return (
    <ExtensionPointsContext value={contributions}>
      {enabled.reduceRight<ReactNode>(
        (inner, manifest) => (
          <MountedExtension key={manifest.id} manifest={manifest} onReady={onReady}>
            {inner}
          </MountedExtension>
        ),
        children,
      )}
    </ExtensionPointsContext>
  )
}
