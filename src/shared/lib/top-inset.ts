/**
 * The top inset, anchored. The app runs under a `black-translucent` status bar — the page paints
 * what sits under the clock (ADR 0006) — so every screen's top is padded by the status bar's
 * height, `--safe-top`. iOS reports that height, `env(safe-area-inset-top)`, late and
 * inconsistently in an installed app: `0` on the first paint, and again for a moment across a
 * keyboard dismiss. A header padded by the live value slid under the clock and back.
 *
 * So the inset is held the way `--app-height` is (`keyboard-viewport.ts`): read through a box that
 * is exactly `env(safe-area-inset-top)` tall, held per shape — installed or in a tab, at this width
 * — raised by a larger reading and never lowered by a smaller one, and remembered so the next
 * launch's boot script (`index.html`) paints the first frame with it. `theme.css` takes the larger
 * of the held value and the live one, so neither a late report nor a dropped one moves the top.
 */

/** Where the held insets are remembered, by shape. `index.html` reads it before first paint. */
export const TOP_INSET_MEMORY_KEY = 'mindscape:top-inset'

export interface TopInsetReading {
  /** What `--safe-top-held` publishes. */
  held: number
  /** What `env(safe-area-inset-top)` reports this frame. */
  reported: number
}

let box: HTMLElement | null = null
let shape = ''
let held = 0

function installed(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * The inset belongs to a shape, not to the device: a tab has Safari's own bar above it and reports
 * no inset, and a rotation moves the inset to the sides. `index.html` spells the same key.
 */
export function topInsetShape(): string {
  return `${installed() ? 'app' : 'tab'}:${window.innerWidth}`
}

function remembered(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(TOP_INSET_MEMORY_KEY) ?? '{}')
    return parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function recall(key: string): number {
  const value = remembered()[key]
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0
}

function remember(key: string, value: number) {
  try {
    localStorage.setItem(TOP_INSET_MEMORY_KEY, JSON.stringify({ ...remembered(), [key]: value }))
  } catch {}
}

const reportedBy = (probe: HTMLElement) => Math.round(probe.getBoundingClientRect().height)

export function readTopInset(): TopInsetReading {
  return { held, reported: box ? reportedBy(box) : 0 }
}

/** Starts the anchor for the life of the page. Called once, from the entry point. */
export function startTopInset(): () => void {
  const root = document.documentElement
  const probe = document.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);' +
    'visibility:hidden;pointer-events:none'
  document.body.append(probe)
  box = probe

  const sample = () => {
    const now = topInsetShape()
    if (now !== shape) {
      shape = now
      held = recall(now)
    }
    const reported = reportedBy(probe)
    if (reported > held) {
      held = reported
      remember(shape, held)
    }
    root.style.setProperty('--safe-top-held', `${held}px`)
  }

  // The box resizes exactly when the reported inset does; `resize` catches a change of shape.
  const observer = new ResizeObserver(sample)
  observer.observe(probe)
  window.addEventListener('resize', sample)
  sample()

  return () => {
    observer.disconnect()
    window.removeEventListener('resize', sample)
    probe.remove()
    box = null
    shape = ''
    held = 0
    root.style.removeProperty('--safe-top-held')
  }
}
