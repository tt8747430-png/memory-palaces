import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { useReducedMotionConfig } from 'motion/react'
import { InMemoryRepository } from '@/shared/api'
import { STATUS_BAR } from '@/shared/config/status-bar'
import { readThemeColors } from '@/shared/lib'
import { removeThemeColors, writeBuiltThemeColors } from '@/shared/test/theme-color'
import {
  createPreferencesStore,
  makePreferences,
  type Preferences,
  PreferencesStoreContext,
} from '@/entities/preferences'
import { MOTION_MIRROR_KEY, THEME_MIRROR_KEY } from './boot-paint'
import { PreferencesProvider } from './PreferencesProvider'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.reducedMotion
  localStorage.removeItem(MOTION_MIRROR_KEY)
  localStorage.removeItem(THEME_MIRROR_KEY)
  removeThemeColors()
})

/** One list of queries the OS is answering "yes" to. */
function mockMatchMedia(matching: readonly string[]) {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: matching.includes(media),
    media,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

function storeWith(preferences: Partial<Preferences>) {
  const stored = {
    ...makePreferences({ id: 'preferences', createdAt: new Date(0).toISOString() }),
    ...preferences,
  }
  return createPreferencesStore(new InMemoryRepository<Preferences>([stored]))
}

function renderWith(preferences: Partial<Preferences>, { loaded = true } = {}) {
  const store = storeWith(preferences)
  if (loaded) store.getState().start()
  render(
    <PreferencesStoreContext value={store}>
      <PreferencesProvider>x</PreferencesProvider>
    </PreferencesStoreContext>,
  )
  return store
}

const damping = () => document.documentElement.dataset.reducedMotion

/** Whether `motion` would damp an animation rendered here. */
function MotionDamping() {
  return <output>{String(useReducedMotionConfig())}</output>
}

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

describe('before the preferences store has loaded', () => {
  /** What `index.html`'s boot script left for a learner who chose dark and damped motion. */
  function bootPainted() {
    document.documentElement.dataset.theme = 'dark'
    document.documentElement.dataset.reducedMotion = 'reduce'
    localStorage.setItem(THEME_MIRROR_KEY, 'dark')
    localStorage.setItem(MOTION_MIRROR_KEY, 'on')
    for (const meta of writeBuiltThemeColors()) meta.content = STATUS_BAR.dark
  }

  it('hands the device none of the defaults, so the boot script’s paint stands', () => {
    // The defaults are `system` and motion on: painted, they handed iOS the OS's colour on every
    // launch whose theme differed from the OS's, and overwrote both mirrors for the next one.
    mockMatchMedia([])
    bootPainted()

    const store = renderWith({ theme: 'dark', reducedMotion: true }, { loaded: false })

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(damping()).toBe('reduce')
    expect(readThemeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBe('dark')
    expect(localStorage.getItem(MOTION_MIRROR_KEY)).toBe('on')

    act(() => store.getState().start())

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(damping()).toBe('reduce')
    expect(readThemeColors()).toEqual([STATUS_BAR.dark, STATUS_BAR.dark])
  })

  it('takes over from the boot script once the learner’s choice is known', () => {
    mockMatchMedia([])
    bootPainted()

    const store = renderWith({ theme: 'light', reducedMotion: false }, { loaded: false })
    act(() => store.getState().start())

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(damping()).toBe('system')
    expect(readThemeColors()).toEqual([STATUS_BAR.light, STATUS_BAR.light])
    expect(localStorage.getItem(THEME_MIRROR_KEY)).toBe('light')
    expect(localStorage.getItem(MOTION_MIRROR_KEY)).toBe('off')
  })

  it('damps motion’s animations on the boot script’s answer, not the default', () => {
    mockMatchMedia([])
    bootPainted()

    render(
      <PreferencesStoreContext value={storeWith({ reducedMotion: true })}>
        <PreferencesProvider>
          <MotionDamping />
        </PreferencesProvider>
      </PreferencesStoreContext>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('true')
  })
})
