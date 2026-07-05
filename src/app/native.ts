import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'

/**
 * Capacitor native-shell tweaks, applied once at startup. A no-op in the browser and the
 * installed PWA (`isNativePlatform()` is false there), so the same web bundle ships
 * everywhere and Safari's own keyboard behaviour stays in charge on the web path.
 */
export async function initNativeShell(): Promise<void> {
  try {
    // Remove the iOS form accessory bar — the prev/next/Done strip that sits above the
    // keyboard and steals vertical space on a phone-only, one-field-at-a-time UI.
    await Keyboard.setAccessoryBarVisible({ isVisible: false })
  } catch {
    // Not an iPhone / plugin unavailable (e.g. Android) — nothing to hide.
  }
}
