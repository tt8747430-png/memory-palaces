const STORAGE_KEY = 'mindscape.keyboard-height'

const KEYBOARD_MIN = 120

const PAN_SETTLE_MS = 150

let measured = 0
let expected = 0
let expecting = false
let reserving = false
let published = -1
let notifiedInset = -1
let notifiedPan = -1

let appHeight = 0
let appWidth = 0
let panned = -1
let compensated = -1
let padded = -1

// Where the layout origin sits in rect coordinates: 0 where rects are layout-relative, -(pan)
// where the UA reports them against the visual viewport.
let originTop = 0

// Whether this UA leaves fixed boxes at the layout origin while it pans — i.e. whether the shell
// rides off the top of the screen and its chrome has to be ridden back. Measured, and sticky: it
// describes the platform, not the moment, so it survives the frames where there is no pan to read
// it from. False until a pan proves otherwise — chrome that has not been shown to be off-screen
// must not be moved.
let ridesOff = false

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
  const next = measured || (reserving ? expected : 0)
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

/**
 * The pan and the transform that undoes it. Published on **every** frame of a pan, including the
 * frames of a drag: the shell rides with the visual viewport, so chrome that updates on a settle
 * visibly lags the screen it is supposed to be pinned to. It is a `translate` — compositor work,
 * no reflow — which is what makes per-frame affordable. Layout must not follow it here; that is
 * `--pan-pad`.
 */
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
 * The same compensation as scroll range at the top of the scrollport — the half of the pair that
 * is *layout*, and so is published only from a resize or a settled scroll. Rewriting a scrollport's
 * padding on every frame of a drag moves the content under the finger and drags the scroll offset
 * with it; between settles it is stale by the distance of the current gesture, which costs range at
 * the top and nothing else.
 */
function publishPad(next: number) {
  if (next === padded) return
  padded = next
  document.documentElement.style.setProperty('--pan-pad', `${next}px`)
}

/**
 * Decides whether this UA rides the fixed shell off the top, by measuring a fixed box rather than
 * inferring from `html` alone.
 *
 * Both readings come from `getBoundingClientRect()`, so the subtraction never crosses coordinate
 * spaces: the visible viewport's top is `pan + originTop` in rect coordinates, and the probe says
 * where a fixed box actually landed. A UA that re-anchors fixed boxes to the visual viewport puts
 * the probe exactly there and the difference is 0 — in *either* space, which `html` alone cannot
 * tell you: it is at the layout origin whether or not fixed boxes were moved off it.
 *
 * Two forced layouts, so it runs on a resize or a settled scroll and never on a drag frame. A pan
 * of 0 says nothing either way and leaves the last answer standing.
 */
function classify(top: number) {
  if (top === 0) {
    originTop = 0
    return
  }
  originTop = Math.round(document.documentElement.getBoundingClientRect().top)
  const fixedTop = Math.round(probe?.getBoundingClientRect().top ?? 0)
  ridesOff = top + originTop - fixedTop > top / 2
}

/** What the classification implies for a pan, without touching the layout to find out. */
function compensationFor(top: number): number {
  return ridesOff ? top : 0
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
  if (expecting === on) return
  expecting = on
  // The reserve bridges the frames before the keyboard reports itself. There is nothing to bridge
  // when it is already up and measured.
  if (on) reserving = measured === 0
  else reserving = false
  publish()
  notifyKeyboard()
}

function createProbe(): HTMLElement {
  const node = document.createElement('div')
  node.dataset.slot = 'viewport-probe'
  node.setAttribute('aria-hidden', 'true')
  // 1px, not 0: an empty box is the kind of thing an engine is free to skip laying out, and its
  // position is the entire measurement.
  node.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;visibility:hidden;pointer-events:none'
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
    reserving = false
    published = -1
    notifiedInset = -1
    notifiedPan = -1
    appHeight = 0
    appWidth = 0
    panned = -1
    compensated = -1
    padded = -1
    originTop = 0
    ridesOff = false
    probe?.remove()
    probe = null
    root.style.removeProperty('--kb-inset')
    root.style.removeProperty('--app-height')
    root.style.removeProperty('--vv-top')
    root.style.removeProperty('--pan-comp')
    root.style.removeProperty('--pan-pad')
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
    publishPad(0)
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

    // The bridge ends at the first keyboard this episode actually measured — after that the
    // measurement rules, including when it says the keyboard is gone. Without this the reserve is
    // republished forever for a field that keeps focus while the keyboard is dismissed (the iOS
    // swipe-down, or `Done` on the accessory bar), which leaves a keyboard-shaped hole in the page.
    if (measured > 0) reserving = false

    // One event, one wake-up: a keyboard that opens changes the inset and the pan in the same
    // frame, and the reveal must run against both, once.
    classify(top)
    const comp = compensationFor(top)
    publish()
    publishTop(top, comp)
    publishPad(comp)
    notifyKeyboard()
  }

  /**
   * Every frame the viewport moves, including under a finger. The shell is anchored to the layout
   * viewport and the screen shows the visual one, so chrome pinned to the top of the screen has to
   * be re-offset as often as that relationship changes — anything less and the header lags the
   * scroll and only lands when the finger lifts. Cheap on purpose: no rect is read here, the
   * classification from the last resize or settle says what the pan means.
   */
  const trackPan = () => {
    if (vv.scale !== 1) return
    const top = readPan()
    publishTop(top, compensationFor(top))
  }

  /**
   * A scroll carries no news about the keyboard, so it never re-measures the height. What it does
   * carry is the pan, which the transform follows live (`trackPan`) and the layout does not: the
   * scrollport's padding and the classification behind it wait for the viewport to stop moving.
   * Reading rects or rewriting padding on a drag frame is what makes the page you type in scroll
   * worse than one you don't.
   */
  const onScroll = () => {
    window.clearTimeout(settle)
    trackPan()
    settle = window.setTimeout(() => {
      if (vv.scale !== 1) return
      const top = readPan()
      classify(top)
      const comp = compensationFor(top)
      publishTop(top, comp)
      publishPad(comp)
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
