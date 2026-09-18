import { create } from 'zustand'

/**
 * Why the splash is up. `intro` — its animation is playing. `boot` — services are being built.
 * `session` — who is signed in, and whether their first Sync is due, is still being worked out.
 * `first-sync` — an account's first Sync on this device is bringing its decks in.
 */
export type SplashHold = 'intro' | 'boot' | 'session' | 'first-sync'

interface SplashState {
  holds: ReadonlySet<SplashHold>
  /** Raising a hold on a splash that is down brings it back, and it plays its intro through. */
  hold: (reason: SplashHold) => void
  release: (reason: SplashHold) => void
  /**
   * The learner let themselves in: past the intro, and past a first Sync still running. What is not
   * decided yet — services, who is signed in — cannot be skipped; the app has nothing to show.
   */
  skip: () => void
}

const OPENING: ReadonlySet<SplashHold> = new Set(['intro', 'boot', 'session'])
const SKIPPABLE: readonly SplashHold[] = ['intro', 'first-sync']

export const useSplashStore = create<SplashState>((set) => ({
  holds: OPENING,
  hold: (reason) =>
    set(({ holds }) => {
      if (holds.has(reason)) return {}
      const next = new Set(holds).add(reason)
      if (holds.size === 0) next.add('intro')
      return { holds: next }
    }),
  release: (reason) =>
    set(({ holds }) => {
      if (!holds.has(reason)) return {}
      const next = new Set(holds)
      next.delete(reason)
      return { holds: next }
    }),
  skip: () =>
    set(({ holds }) => ({
      holds: new Set([...holds].filter((reason) => !SKIPPABLE.includes(reason))),
    })),
}))

export const selectSplashShown = (state: Pick<SplashState, 'holds'>): boolean =>
  state.holds.size > 0

/** Its intro has played and a first Sync is still running — the overlay says what it waits on. */
export const selectSplashWaitingOnSync = (state: Pick<SplashState, 'holds'>): boolean =>
  state.holds.has('first-sync') && !state.holds.has('intro')

/** Whether the splash covers the app right now. It can come back, so this is not "done". */
export const useSplashShown = () => useSplashStore(selectSplashShown)
