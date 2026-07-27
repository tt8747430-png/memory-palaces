import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'mindscape.dev-mode'

const listeners = new Set<() => void>()

let enabled = read()

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setDevMode(next: boolean) {
  if (enabled === next) return
  enabled = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
  listeners.forEach((listener) => listener())
}

export function useDevMode(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  )
}
