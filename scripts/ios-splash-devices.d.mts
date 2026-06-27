export interface IosSplashDevice {
  /** CSS-point width (the value iOS reports as `device-width`). */
  w: number
  /** CSS-point height (the value iOS reports as `device-height`). */
  h: number
  /** Device-pixel-ratio (`-webkit-device-pixel-ratio`). */
  dpr: number
  /** Human-readable device names this entry covers. */
  label: string
}

export const iosSplashDevices: IosSplashDevice[]

/** Physical-pixel resolution the PNG is rendered at. */
export function physical(device: IosSplashDevice): { pw: number; ph: number }

/** The media query iOS matches a startup image against. */
export function splashMedia(device: IosSplashDevice): string

/** Public path of a device's launch image. */
export function splashHref(device: IosSplashDevice): string
