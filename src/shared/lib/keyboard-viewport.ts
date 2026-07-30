const STORAGE_KEY = 'mindscape.keyboard-height'

const KEYBOARD_MIN = 120

const PAN_SETTLE_MS = 150

let measured = 0
let expected = 0
let expecting = false
let published = -1
let notifiedInset = -1
let notifiedPan = -1

let appHeight = 0
let appWidth = 0
let panned = -1
let compensated = -1
let following = false

// Where the layout origin sits in rect coordinates: 0 where rects are layout-relative, -(pan)
// where the UA reports them against the visual viewport.
let originTop = 0

/**
 * A `position: fixed` box at `top: 0` that nothing ever translates — a witness for where this UA
 * puts fixed boxes while the keyboard pans. `#root` is one too, so whatever happened to the probe
 * has happened to the shell.
 */
let probe: HTMLElement | null = null

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

/** Publishes the inset. Notifying is the caller's job — one keyboard event can change the inset
 *  and the pan together, and subscribers want one wake-up, not two. */
function publish() {
  const next = measured || (expecting ? expected : 0)
  if (next === published) return
  published = next
  document.documentElement.style.setProperty('--kb-inset', `${next}px`)
  document.documentElement.toggleAttribute('data-keyboard', next > 0)
}

/**
 * One wake-up per keyboard event, however many writes it took, and none for an event that moved
 * nothing. Comparing against what was last announced rather than against what this call happened to
 * write is what keeps a pan published live a frame earlier — the platform revealing a field it has
 * just been given — from swallowing the notification the resize owes its subscribers.
 */
function notifyKeyboard() {
  if (published === notifiedInset && panned === notifiedPan) return
  notifiedInset = published
  notifiedPan = panned
  heightListeners.forEach((listener) => listener())
}

function publishHeight(next: number) {
  if (next === appHeight) return
  appHeight = next
  document.documentElement.style.setProperty('--app-height', `${next}px`)
}

function publishTop(next: number, comp: number) {
  if (next === panned && comp === compensated) return
  panned = next
  compensated = comp
  const style = document.documentElement.style
  style.setProperty('--vv-top', `${next}px`)
  style.setProperty('--pan-comp', `${comp}px`)
  panListeners.forEach((listener) => listener())
}

/**
 * How far the fixed shell sits above the top of the visible viewport — the ride-off to give back —
 * measured on a fixed box rather than inferred from `html` alone.
 *
 * Both readings come from `getBoundingClientRect()`, so the subtraction never crosses coordinate
 * spaces: the visible viewport's top is `pan + originTop` in rect coordinates, and the probe says
 * where a fixed box actually landed. A UA that re-anchors fixed boxes to the visual viewport puts
 * the probe exactly there and the difference is 0 — in *either* space, which `html` alone cannot
 * tell you: it is at the layout origin whether or not fixed boxes were moved off it.
 */
function measureCompensation(top: number): number {
  // No pan, nothing to convert or give back: the two spaces coincide. Worth the branch — it keeps
  // every keyboardless viewport event off the layout path.
  if (top === 0) {
    originTop = 0
    return 0
  }
  originTop = Math.round(document.documentElement.getBoundingClientRect().top)
  const fixedTop = Math.round(probe?.getBoundingClientRect().top ?? 0)
  return Math.max(0, top + originTop - fixedTop)
}

function viewportHeight(): number {
  return appHeight || document.documentElement.clientHeight
}

/**
 * The bottom of the usable area, in rect coordinates — the one bridge between the two spaces. The
 * visible area ends `--kb-inset` above the anchored shell's bottom in layout coordinates, and
 * `originTop` is where those coordinates begin in rect ones: 0 where rects are layout-relative,
 * -(pan) where they already carry it.
 */
export function visibleBottom(): number {
  return originTop + viewportHeight() - keyboardHeight()
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
  // Set on every focus, not only the first: moving between fields re-pans without resizing, and
  // that pan is the platform revealing the field, not the page scrolling.
  following = on
  if (expecting === on) return
  expecting = on
  publish()
  notifyKeyboard()
}

function createProbe(): HTMLElement {
  const node = document.createElement('div')
  node.dataset.slot = 'viewport-probe'
  node.setAttribute('aria-hidden', 'true')
  node.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none'
  document.body.append(node)
  return node
}

export function startKeyboardViewport(): () => void {
  const root = document.documentElement
  const vv = window.visualViewport
  expected = readStored()
  probe = createProbe()

  const reset = () => {
    measured = 0
    expecting = false
    following = false
    published = -1
    notifiedInset = -1
    notifiedPan = -1
    appHeight = 0
    appWidth = 0
    panned = -1
    compensated = -1
    originTop = 0
    probe?.remove()
    probe = null
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
    publishTop(0, 0)
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

    // One event, one wake-up: a keyboard that opens changes the inset and the pan in the same
    // frame, and the reveal must run against both, once.
    publish()
    publishTop(top, measureCompensation(top))
    notifyKeyboard()
  }

  const publishPan = () => {
    if (vv.scale !== 1) return
    const top = readPan()
    publishTop(top, measureCompensation(top))
  }

  /**
   * A scroll carries no news about the keyboard, and mid-drag the visual viewport slides with the
   * rubber-band — chrome positioned from those frames follows the finger down the screen. So a
   * scroll publishes only once the viewport has stopped moving.
   *
   * Unless a field has just taken focus: iOS then re-pans to reveal it without ever resizing, and
   * animates that pan over several hundred milliseconds. Waiting out the settle rides the shell —
   * and the chrome riding back on it — off the screen for the length of that animation and snaps it
   * back. A drag never begins with a focus, so it still only publishes once it has stopped.
   */
  const onScroll = () => {
    window.clearTimeout(settle)
    if (following) publishPan()
    settle = window.setTimeout(() => {
      following = false
      publishPan()
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
