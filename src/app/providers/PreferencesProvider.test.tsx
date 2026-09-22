import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { InMemoryRepository } from '@/shared/api'
import {
  createPreferencesStore,
  makePreferences,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { MOTION_MIRROR_KEY } from './boot-paint'
import { PreferencesProvider } from './PreferencesProvider'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.reducedMotion
  localStorage.removeItem(MOTION_MIRROR_KEY)
})

/** One list of queries the OS is answering "reduce" to. */
function mockMatchMedia(reducing: readonly string[]) {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: reducing.includes(media),
    media,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

function renderWith(preferences: Partial<Preferences>) {
  const stored = {
    ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
    ...preferences,
  }
  const store = createPreferencesStore(new InMemoryRepository<Preferences>([stored]))
  store.getState().start()
  render(
    <PreferencesStoreContext value={store}>
      <PreferencesProvider>x</PreferencesProvider>
    </PreferencesStoreContext>,
  )
}

const damping = () => document.documentElement.dataset.reducedMotion

describe('the learner’s motion switch', () => {
  it('damps the whole document, not only what motion animates', () => {
    mockMatchMedia([])
    renderWith({ reducedMotion: true })

    expect(damping()).toBe('reduce')
  })

  it('leaves motion alone when neither the learner nor the OS asked', () => {
    mockMatchMedia([])
    renderWith({ reducedMotion: false })

    expect(damping()).toBe('system')
  })

  it('still honours the OS when the learner’s own switch is off', () => {
    mockMatchMedia(['(prefers-reduced-motion: reduce)'])
    renderWith({ reducedMotion: false })

    expect(damping()).toBe('reduce')
  })

  it('mirrors the switch so the next first paint already knows it', () => {
    mockMatchMedia([])
    renderWith({ reducedMotion: true })

    expect(localStorage.getItem(MOTION_MIRROR_KEY)).toBe('on')
  })
})
