import { useEffect, useRef } from 'react'

interface MotionPermissionCtor {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
}

function motionCtor(): (typeof globalThis.DeviceMotionEvent & MotionPermissionCtor) | undefined {
  if (typeof window === 'undefined' || typeof window.DeviceMotionEvent === 'undefined') {
    return undefined
  }
  return window.DeviceMotionEvent as typeof globalThis.DeviceMotionEvent & MotionPermissionCtor
}

export function motionSupported(): boolean {
  return motionCtor() !== undefined
}

export async function requestMotionPermission(): Promise<boolean> {
  const ctor = motionCtor()
  if (!ctor) return false
  if (typeof ctor.requestPermission !== 'function') return true
  try {
    return (await ctor.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

const SHAKE_THRESHOLD = 16
const SHAKE_COOLDOWN_MS = 900
const SAMPLE_MIN_MS = 40

export function useShake(enabled: boolean, onShake: () => void): void {
  const callback = useRef(onShake)
  callback.current = onShake

  useEffect(() => {
    if (!enabled || !motionSupported()) return
    let last = { x: 0, y: 0, z: 0, t: 0 }
    let lastFire = 0

    const handler = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity
      if (!a) return
      const now = event.timeStamp || Date.now()
      if (now - last.t < SAMPLE_MIN_MS) return
      const dx = (a.x ?? 0) - last.x
      const dy = (a.y ?? 0) - last.y
      const dz = (a.z ?? 0) - last.z
      last = { x: a.x ?? 0, y: a.y ?? 0, z: a.z ?? 0, t: now }
      const jerk = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (jerk <= SHAKE_THRESHOLD || now - lastFire <= SHAKE_COOLDOWN_MS) return
      const active = document.activeElement
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return
      lastFire = now
      callback.current()
    }

    window.addEventListener('devicemotion', handler)
    return () => window.removeEventListener('devicemotion', handler)
  }, [enabled])
}
