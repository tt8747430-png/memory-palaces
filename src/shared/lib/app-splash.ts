import { create } from 'zustand'

interface SplashState {
  done: boolean
  finish: () => void
}

export const useSplashStore = create<SplashState>((set) => ({
  done: false,
  finish: () => set({ done: true }),
}))

export const useSplashDone = () => useSplashStore((state) => state.done)
