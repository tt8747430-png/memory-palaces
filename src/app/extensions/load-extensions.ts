import { i18n } from '@/shared/i18n'
import type { ExtensionManifest, ExtensionRuntimeModule } from '@/shared/lib'

export interface LoadedExtension {
  manifest: ExtensionManifest
  activate: ExtensionRuntimeModule['activate']
}

/**
 * Awaited once in `createServices`, behind the splash, for every registered extension, on or off —
 * exactly as its collections are. Its messages, because the Extensions screen names every extension
 * the build carries and a label is a key in the extension's own namespace; its runtime, because
 * switching it on must activate it at once — a chunk still in flight then is a screen rendered
 * before the stores it reads exist. Only its screens stay lazy, one chunk per route.
 *
 * A chunk that will not load rejects this, and `Bootstrap` shows its error screen: the same answer
 * a collection chunk already gets, rather than an extension half there.
 */
export function loadExtensions(
  manifests: readonly ExtensionManifest[],
): Promise<LoadedExtension[]> {
  return Promise.all(
    manifests.map(async (manifest) => {
      const [messages, runtime] = await Promise.all([
        manifest.loadMessages(),
        manifest.loadRuntime(),
      ])
      i18n.addResourceBundle('en', manifest.namespace, messages, true, false)
      return { manifest, activate: runtime.activate }
    }),
  )
}
