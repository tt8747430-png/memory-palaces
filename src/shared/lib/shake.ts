import { useEffect, useRef } from 'react'

/** iOS 13+ gates DeviceMotion behind a permission prompt exposed as a static method. */
interface MotionPermissionCtor {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
}

function motionCtor(): (typeof globalThis.DeviceMotionEvent & MotionPermissionCtor) | undefined {
  if (typeof window === 'undefined' || typeof window.DeviceMotionEvent === 'undefined') {
    return undefined
  }
  return window.DeviceMotionEvent as typeof globalThis.DeviceMotionEvent & MotionPermissionCtor
}

/** Whether this platform can report device motion at all (false on desktop browsers). */
export function motionSupported(): boolean {
  return motionCtor() !== undefined
}

/**
 * Ask for device-motion permission. On iOS Safari this MUST be called from a user gesture
 * (e.g. flipping a settings toggle) or it rejects; elsewhere no prompt exists and it resolves
 * `true` when motion is supported. Returns whether shake input is now allowed.
 */
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

/**
 * Fire `onShake` when the device is shaken, while `enabled`. A jerk (frame-to-frame change in
 * acceleration) past a threshold triggers it, rate-limited by a cooldown so one shake is one
 * call. Ignored while a text field is focused so typing can't trip it. No-op where motion is
 * unsupported or permission was never granted.
 */
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
