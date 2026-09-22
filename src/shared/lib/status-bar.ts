/**
 * The status bar is not the app's to paint. The platform tints it — from `theme-color`, or, where
 * that is not honoured, by sampling whatever the page puts under it. So the app can only keep the
 * two answers the same and check that it has: a glass header over a white card samples white, and
 * the theme breaks at the top of the screen with nothing in the app looking wrong.
 */

export interface StatusBarPaint {
  /** The colour `--status-bar` names for the scheme now painted. */
  declared: string
  /** What `<meta name="theme-color">` is telling the platform. */
  meta: string
  /** The first opaque background actually painted at the top edge, or '' if nothing is. */
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
 * Fully opaque, not merely visible. A glass header is the case this check exists for: it tints
 * whatever scrolled beneath it rather than replacing it, so the colour under the bar is the first
 * fill that stops the light — a white card behind the glass, not the glass.
 */
function isOpaque(color: string): boolean {
  if (!color || color === 'transparent') return false
  const alpha = /^rgba\([^)]*,([\d.]+)\)$/.exec(color.replace(/\s+/g, ''))
  return alpha?.[1] === undefined || Number.parseFloat(alpha[1]) === 1
}

/**
 * The colour a sampler would land on from here: the first fill up the tree that stops the light.
 * '' when the whole ancestry is see-through, which is the page leaving the bar to the platform.
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

/**
 * Whether the pixels under the bar agree with it. A sampling platform reads these, not the meta, so
 * a `false` here is the white bar the learner sees over a correctly-configured app.
 */
export function statusBarIsPainted(paint: StatusBarPaint): boolean {
  if (!paint.painted) return false
  return resolved(paint.declared) === paint.painted
}
