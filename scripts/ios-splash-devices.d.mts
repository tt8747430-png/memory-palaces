export interface IosSplashDevice {
  /** CSS-point width in natural portrait (the value iOS reports as `device-width`). */
  w: number
  /** CSS-point height in natural portrait (the value iOS reports as `device-height`). */
  h: number
  /** Device-pixel-ratio (`-webkit-device-pixel-ratio`). */
  dpr: number
  /** Human-readable device names this entry covers. */
  label: string
}

export type Orientation = 'portrait' | 'landscape'

export const iosSplashDevices: IosSplashDevice[]
export const ORIENTATIONS: readonly Orientation[]

/** Physical-pixel resolution the PNG is rendered at. */
export function physical(device: IosSplashDevice, orientation: Orientation): { pw: number; ph: number }

/** The media query iOS matches a startup image against. */
export function splashMedia(device: IosSplashDevice, orientation: Orientation): string

/** Public path of a device's launch image. */
export function splashHref(device: IosSplashDevice, orientation: Orientation): string
