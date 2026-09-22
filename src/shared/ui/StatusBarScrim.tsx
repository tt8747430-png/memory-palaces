import type { ColorScheme } from '@/shared/lib'

export interface StatusBarScrimProps {
  /** The surface the clock sits on. A dark one needs nothing. */
  tone: ColorScheme
}

/**
 * A shade at the top edge of a light surface that runs under the status bar. iOS draws the clock
 * white under a translucent bar (ADR 0006), and white on a pale scene is unreadable. It is as tall
 * as the bar and fades out below it, so it is nothing at all where there is no bar — a browser tab.
 *
 * Drawn before the screen's own header, so the header's controls sit over it.
 */
export function StatusBarScrim({ tone }: StatusBarScrimProps) {
  if (tone === 'dark') return null
  return (
    <div
      aria-hidden
      data-slot="status-scrim"
      className="pointer-events-none absolute inset-x-0 top-0 h-[calc(var(--safe-top)*1.4)] bg-(image:--status-scrim)"
    />
  )
}
