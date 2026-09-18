import { beforeEach, describe, expect, it } from 'vitest'
import { selectSplashShown, selectSplashWaitingOnSync, useSplashStore } from './app-splash'

const state = () => useSplashStore.getState()

/** The app is open: intro played, services built, the session and its first Sync decided. */
const open = () => {
  state().release('intro')
  state().release('boot')
  state().release('session')
}

beforeEach(() => useSplashStore.setState(useSplashStore.getInitialState(), true))

describe('the splash store', () => {
  it('opens held by its intro, boot and the session, and shows until all three are released', () => {
    expect(selectSplashShown(state())).toBe(true)
    state().release('intro')
    state().release('boot')
    expect(selectSplashShown(state())).toBe(true)
    state().release('session')
    expect(selectSplashShown(state())).toBe(false)
  })

  it('plays its intro through when a hold brings it back — it never flashes', () => {
    open()
    state().hold('first-sync')
    expect(state().holds).toEqual(new Set(['first-sync', 'intro']))
    state().release('first-sync')
    expect(selectSplashShown(state())).toBe(true)
    state().release('intro')
    expect(selectSplashShown(state())).toBe(false)
  })

  it('adds no intro to a splash already showing', () => {
    state().release('intro')
    state().hold('first-sync')
    expect(state().holds).toEqual(new Set(['boot', 'session', 'first-sync']))
  })

  it('says it is waiting on a first Sync only once its intro has played', () => {
    state().hold('first-sync')
    expect(selectSplashWaitingOnSync(state())).toBe(false)
    state().release('intro')
    expect(selectSplashWaitingOnSync(state())).toBe(true)
  })

  it('lets the learner skip the intro and a running first Sync, never what is undecided', () => {
    state().hold('first-sync')
    state().skip()
    expect(state().holds).toEqual(new Set(['boot', 'session']))
  })
})
