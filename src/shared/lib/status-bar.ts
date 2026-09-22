/**
 * What the app tells a platform about its status bar, and what it paints under it.
 *
 * On iOS the page runs under a `black-translucent` bar and paints what sits there itself (ADR
 * 0006), so there is nothing to tell. Android reads `theme-color` and follows it as it changes:
 * `--status-bar` names the colour per scheme and `ThemeProvider` writes it, so the bar and the
 * header's chrome — painted from the same token — agree.
 */

export interface StatusBarPaint {
  /** The colour `--status-bar` names for the scheme now painted. */
  declared: string
  /** What `<meta name="theme-color">` is telling the platform. */
  meta: string
  /** The first opaque fill actually painted at the top edge, under the clock, or '' if none is. */
  painted: string
}

/** The colour the stylesheet names, once a theme is on the document. '' before it loads. */
export function statusBarColor(): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue('--status-bar').trim()
}

function metaContent(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content.trim() ?? ''
}

/** Normalised through the engine, so a hex, an `oklch()` and an `rgb()` can be compared at all. */
function resolved(color: string): string {
  if (!color) return ''
  const probe = document.createElement('span')
  probe.style.display = 'none'
  probe.style.backgroundColor = color
  document.body.append(probe)
  const painted = getComputedStyle(probe).backgroundColor
  probe.remove()
  return painted
}

/**
 * The alpha a computed colour carries. Engines serialise it three ways — `rgba(r, g, b, a)`, and
 * `oklch(l c h / a)` or `color(srgb r g b / a)` for colours that kept their space — and a backdrop
 * mixed at 38% read as opaque when only the first was understood.
 */
function alphaOf(color: string): number {
  const slash = /\/\s*([\d.]+)(%?)\s*\)$/.exec(color)
  if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1)
  const legacy = /^rgba\(([^)]*)\)$/.exec(color.replace(/\s+/g, ''))
  const parts = legacy?.[1]?.split(',') ?? []
  return parts.length === 4 ? Number(parts[3]) : 1
}

/**
 * Fully opaque, not merely visible. A translucent layer — glass, a backdrop — tints whatever lies
 * beneath rather than replacing it, so the colour under the bar is the first fill that stops the
 * light.
 */
function isOpaque(color: string): boolean {
  if (!color || color === 'transparent') return false
  return alphaOf(color) === 1
}

/**
 * The fill under the clock from here: the first up the tree that stops the light. A gradient is
 * an image, not a colour, so a scene reads as whatever opaque fill sits behind it. '' when the
 * whole ancestry is see-through.
 */
export function paintedBehind(element: Element | null): string {
  for (let node = element; node instanceof Element; node = node.parentElement) {
    const color = getComputedStyle(node).backgroundColor
    if (isOpaque(color)) return color
  }
  return ''
}

function paintedAtTopEdge(): string {
  // Only a rendering engine can answer where the top edge lands; jsdom has no point to hit.
  if (typeof document.elementFromPoint !== 'function') return ''
  return paintedBehind(document.elementFromPoint(Math.round(window.innerWidth / 2), 1))
}

export function readStatusBarPaint(): StatusBarPaint {
  if (typeof document === 'undefined') return { declared: '', meta: '', painted: '' }
  return { declared: statusBarColor(), meta: metaContent(), painted: paintedAtTopEdge() }
}

/**
 * Whether the platform has been told the colour the stylesheet names. False while the meta is
 * missing, empty or stale — the state that leaves the bar to the page's own pixels.
 */
export function statusBarIsDeclared(paint: StatusBarPaint): boolean {
  if (!paint.declared || !paint.meta) return false
  return resolved(paint.declared) === resolved(paint.meta)
}
