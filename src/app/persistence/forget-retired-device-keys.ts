/**
 * Device-local keys an older build wrote and nothing reads any more. Deleting a key's reader leaves
 * its bytes on every device that ran it, so the key comes here instead, and the next launch clears
 * it. A key whose value still has to go somewhere is moved, not forgotten (`adopt-device-settings`).
 */
export const RETIRED_DEVICE_KEYS = [
  // The top inset the boot script remembered under `black-translucent` (ADR 0007).
  'mindscape:top-inset',
] as const

export function forgetRetiredDeviceKeys(): void {
  try {
    for (const key of RETIRED_DEVICE_KEYS) localStorage.removeItem(key)
  } catch {}
}
