import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'mindscape.probe-overlay'

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

export function setProbeOverlay(next: boolean) {
  if (enabled === next) return
  enabled = next
  try {
    if (next) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
  listeners.forEach((listener) => listener())
}

export function useProbeOverlay(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  )
}
