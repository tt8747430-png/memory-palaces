import { afterEach, describe, expect, it, vi } from 'vitest'
import { InMemoryRepository } from '@/shared/api'
import { setDevMode } from '@/shared/lib'
import { ROUTES } from '@/shared/config/routes'
import { i18n } from '@/shared/i18n'
import { EXTENSIONS } from './extensions/registry'
import { createExtensionRuntime } from './extensions/extension-runtime'
import { loadExtensions } from './extensions/load-extensions'
import { preferencesWith } from './extensions/testing/fake-extension'
import type { Services } from './composition-root'
import { createAppRouter } from './router'

const IMPORT = '/import/bible'
const LIBRARY = '/settings/extensions/bible'

/** The router reads only the session and the extension runtime before it renders anything. */
async function routerWith(extensions: string[]) {
  const runtime = createExtensionRuntime({
    extensions: await loadExtensions(EXTENSIONS),
    preferences: preferencesWith(extensions),
    repositories: { bibleVerses: new InMemoryRepository([]) },
  })
  runtime.start()
  const services = {
    sessionStore: { getState: () => ({ status: 'ready', session: { kind: 'account' } }) },
    extensions: runtime,
  } as unknown as Services
  return createAppRouter(services)
}

async function open(extensions: string[], to: string) {
  const router = await routerWith(extensions)
  await router.navigate({ to } as never)
  return router.state.location
}

afterEach(() => {
  setDevMode(false)
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
    for (const path of [IMPORT, LIBRARY]) {
      const route = router.routesByPath[path as keyof typeof router.routesByPath]
      expect((route?.options.component as { preload?: unknown }).preload).toBeTypeOf('function')
    }
  })

  it('send a learner whose extension is off to Settings, saying which one', async () => {
    const location = await open([], IMPORT)
    expect(location.pathname).toBe(ROUTES.settingsExtensions)
    expect(location.search).toEqual({ highlight: 'bible' })
  })

  it('keep the admin screen to dev mode', async () => {
    expect((await open(['bible'], LIBRARY)).pathname).toBe(ROUTES.settingsExtensions)
    setDevMode(true)
    expect((await open(['bible'], LIBRARY)).pathname).toBe(LIBRARY)
  })
})
