import { create } from 'zustand'

interface SplashState {
  /** False until the launch overlay has finished (or been skipped). */
  done: boolean
  finish: () => void
}

/**
 * The launch overlay's state, kept outside the router so chrome mounted above it — the toaster,
 * anything else that speaks before the learner has arrived — can wait its turn. Nothing may
 * take focus or raise a notification while this is `false`.
 */
export const useSplashStore = create<SplashState>((set) => ({
  done: false,
  finish: () => set({ done: true }),
}))

export const useSplashDone = () => useSplashStore((state) => state.done)
