import { afterEach, describe, expect, it, vi } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { ROUTES } from '@/shared/config/routes'
import { i18n } from '@/shared/i18n'
import { NO_PENDING } from '@/shared/lib'
import { EXTENSIONS } from './extensions/registry'
import { createExtensionRuntime } from './extensions/extension-runtime'
import { loadExtensions } from './extensions/load-extensions'
import { preferencesWith } from './extensions/testing/fake-extension'
import type { Services } from './composition-root'
import { createAppRouter } from './router'

const IMPORT = '/import/bible'
const SETTINGS = '/settings/extensions/bible'

/** The router reads only the session, preferences and the runtime before it renders anything. */
async function routerWith(extensions: string[], devMode = false) {
  const preferencesStore = preferencesWith(extensions, { devMode })
  const runtime = createExtensionRuntime({
    extensions: await loadExtensions(EXTENSIONS),
    preferences: preferencesStore,
    repositories: { bibleVerses: new InMemoryRepository([]) },
    pending: () => NO_PENDING,
  })
  runtime.start()
  const services = {
    sessionStore: { getState: () => ({ status: 'ready', session: { kind: 'account' } }) },
    preferencesStore,
    extensions: runtime,
  } as unknown as Services
  return createAppRouter(services)
}

async function open(extensions: string[], to: string, devMode = false) {
  const router = await routerWith(extensions, devMode)
  await router.navigate({ to } as never)
  return router.state.location
}

afterEach(() => {
  i18n.removeResourceBundle('en', 'bible')
})

describe('extension routes', () => {
  it('serve the path the manifest declared, inside the extension’s gate', async () => {
    const router = await routerWith(['bible'])
    await router.navigate({ to: IMPORT } as never)
    expect(router.state.location.pathname).toBe(IMPORT)
    expect(router.state.matches.map((match) => match.routeId)).toContain('/extension-bible')
  })

  it('keep their screen a lazy route component, so it is preloaded on intent', async () => {
    // A lazy component drops `preload` once its chunk is in, and the route tree is module state:
    // a fresh module is the only honest look at a screen nothing has loaded yet.
    vi.resetModules()
    const fresh = await import('./router')
    const router = fresh.createAppRouter({} as Services)
    for (const path of [IMPORT, SETTINGS]) {
      const route = router.routesByPath[path as keyof typeof router.routesByPath]
      expect((route?.options.component as { preload?: unknown }).preload).toBeTypeOf('function')
    }
  })

  it('send a learner whose extension is off to Settings, saying which one', async () => {
    const location = await open([], IMPORT)
    expect(location.pathname).toBe(ROUTES.settingsExtensions)
    expect(location.search).toEqual({ highlight: 'bible' })
  })

  it('serve the settings screen to anyone with the extension on, dev mode or not', async () => {
    expect((await open(['bible'], SETTINGS)).pathname).toBe(SETTINGS)
    expect((await open([], SETTINGS)).pathname).toBe(ROUTES.settingsExtensions)
  })
})
