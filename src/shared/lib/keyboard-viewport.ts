const STORAGE_KEY = 'mindscape.keyboard-height'

const KEYBOARD_MIN = 120

const PAN_SETTLE_MS = 150

let measured = 0
let expected = 0
let expecting = false
let published = -1

let appHeight = 0
let appWidth = 0
let panned = -1
let compensated = -1

// Whether getBoundingClientRect() already reports the pan. Assume it does until a pan proves
// otherwise: that is the branch where nothing is compensated, so a wrong guess leaves chrome where
// the platform put it rather than moving it twice.
let baked = true

const heightListeners = new Set<() => void>()
const panListeners = new Set<() => void>()

function readStored(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const value = raw ? Number(raw) : 0
    return Number.isFinite(value) && value >= KEYBOARD_MIN ? Math.round(value) : 0
  } catch {
    return 0
  }
}

function writeStored(value: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {}
}

/** Publishes the inset and reports whether it moved. Notifying is the caller's job — one keyboard
 *  event can change the inset and the pan together, and subscribers want one wake-up, not two. */
function publish(): boolean {
  const next = measured || (expecting ? expected : 0)
  if (next === published) return false
  published = next
  document.documentElement.style.setProperty('--kb-inset', `${next}px`)
  document.documentElement.toggleAttribute('data-keyboard', next > 0)
  return true
}

function notifyKeyboard() {
  heightListeners.forEach((listener) => listener())
}

function publishHeight(next: number) {
  if (next === appHeight) return
  appHeight = next
  document.documentElement.style.setProperty('--app-height', `${next}px`)
}

function publishTop(next: number): boolean {
  const comp = baked ? 0 : next
  if (next === panned && comp === compensated) return false
  panned = next
  compensated = comp
  const style = document.documentElement.style
  style.setProperty('--vv-top', `${next}px`)
  style.setProperty('--pan-comp', `${comp}px`)
  panListeners.forEach((listener) => listener())
  return true
}

/**
 * Which coordinate space `getBoundingClientRect()` uses, decided by measurement rather than by
 * display mode. A UA that re-anchors `position: fixed` to the visual viewport reports rects with
 * the pan already in them (`html` sits at `-offsetTop`) and needs no compensation; one that does
 * not leaves `html` at 0 and rides the shell off the top of the screen.
 *
 * Only a real pan can answer it, so the flag holds its last reading while `offsetTop` is 0.
 */
function detectSpace(top: number) {
  if (top <= 0) return
  const htmlTop = document.documentElement.getBoundingClientRect().top
  baked = Math.abs(htmlTop + top) < 1
}

function viewportHeight(): number {
  return appHeight || document.documentElement.clientHeight
}

function viewportTop(): number {
  return Math.max(0, panned)
}

export function isPanBakedIntoRects(): boolean {
  return baked
}

/**
 * The bottom of the usable area, in rect coordinates — the one bridge between the two spaces.
 * The visible area spans `[offsetTop, offsetTop + visualViewport.height]` in layout coordinates
 * and `[0, visualViewport.height]` in visual ones, so the pan cancels out of exactly one of them.
 */
export function visibleBottom(): number {
  return viewportHeight() - keyboardHeight() - (baked ? viewportTop() : 0)
}

export function keyboardHeight(): number {
  return Math.max(0, published)
}

/**
 * Fires once per keyboard event — the inset changing, or the pan changing *with* it on a resize.
 * Never fires for a pan the page produced by scrolling; that is `subscribePan`.
 */
export function subscribeKeyboardHeight(listener: () => void): () => void {
  heightListeners.add(listener)
  return () => {
    heightListeners.delete(listener)
  }
}

/**
 * Fires whenever the published pan changes, including the settled pan after a scroll. Anything
 * that moves the scroll position must take `subscribeKeyboardHeight` instead: a pan the page
 * produced by scrolling is not news about the keyboard, and re-scrolling on one writes over the
 * scroll the user is performing.
 */
export function subscribePan(listener: () => void): () => void {
  panListeners.add(listener)
  return () => {
    panListeners.delete(listener)
  }
}

export function expectKeyboard(on: boolean) {
  if (expecting === on) return
  expecting = on
  if (publish()) notifyKeyboard()
}

export function startKeyboardViewport(): () => void {
  const root = document.documentElement
  const vv = window.visualViewport
  expected = readStored()

  const reset = () => {
    measured = 0
    expecting = false
    published = -1
    appHeight = 0
    appWidth = 0
    panned = -1
    compensated = -1
    baked = true
    root.style.removeProperty('--kb-inset')
    root.style.removeProperty('--app-height')
    root.style.removeProperty('--vv-top')
    root.style.removeProperty('--pan-comp')
    root.removeAttribute('data-keyboard')
  }

  const anchor = () => {
    const width = root.clientWidth
    if (width !== appWidth) {
      appWidth = width
      publishHeight(root.clientHeight)
      return
    }
    if (!expecting && root.clientHeight > appHeight) publishHeight(root.clientHeight)
  }

  if (!vv) {
    anchor()
    publishTop(0)
    publish()
    return reset
  }

  let frame = 0
  let settle = 0

  const readPan = () => Math.max(0, Math.round(vv.offsetTop))

  const measure = () => {
    frame = 0

    // Layout viewport — pinch-zoom never touches it. Safe before the guard.
    anchor()

    // Zoom shrinks vv.height and pans offsetTop exactly like the keyboard; scale is the only
    // tell. iOS ignores user-scalable=no, so it is reachable. Freeze on last unzoomed read.
    if (vv.scale !== 1) return

    const top = readPan()
    const gap = Math.max(0, appHeight - vv.height - top)
    const next = gap >= KEYBOARD_MIN ? Math.round(gap) : 0
    if (next !== measured) {
      measured = next
      if (next > expected) {
        expected = next
        writeStored(next)
      }
    }

    detectSpace(top)

    // One event, one wake-up: a keyboard that opens changes the inset and the pan in the same
    // frame, and the reveal must run against both, once.
    const insetMoved = publish()
    const panMoved = publishTop(top)
    if (insetMoved || panMoved) notifyKeyboard()
  }

  /**
   * A scroll carries no news about the keyboard, but iOS re-pans without resizing when focus moves
   * between fields — so the pan cannot simply be ignored here. It is published only once the
   * viewport has stopped moving: mid-drag the visual viewport slides with the rubber-band, and
   * chrome positioned from those frames follows the finger down the screen.
   */
  const onScroll = () => {
    window.clearTimeout(settle)
    settle = window.setTimeout(() => {
      if (vv.scale !== 1) return
      const top = readPan()
      detectSpace(top)
      publishTop(top)
    }, PAN_SETTLE_MS)
  }

  const onResize = () => {
    window.clearTimeout(settle)
    if (!frame) frame = window.requestAnimationFrame(measure)
  }

  measure()
  vv.addEventListener('resize', onResize)
  vv.addEventListener('scroll', onScroll)
  window.addEventListener('orientationchange', onResize)

  return () => {
    window.cancelAnimationFrame(frame)
    window.clearTimeout(settle)
    vv.removeEventListener('resize', onResize)
    vv.removeEventListener('scroll', onScroll)
    window.removeEventListener('orientationchange', onResize)
    reset()
  }
}
