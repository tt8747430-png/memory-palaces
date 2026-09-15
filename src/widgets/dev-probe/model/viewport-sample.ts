/**
 * Measurement: what the viewport is doing right now, and which ADR 0002 rule each number breaks.
 * Formatting lives in `viewport-text.ts` and the per-frame sampler in `use-viewport-probe.ts`.
 */
import {
  CHROME,
  isTextField,
  keyboardIsMeasured,
  revealOffset,
  visibleBottom,
  REVEAL_SCROLL_ATTR,
} from '@/shared/lib'

export interface ViewportSample {
  route: string
  mode: string
  layoutHeight: number
  layoutWidth: number
  vvHeight: number
  vvOffsetTop: number
  vvScale: number
  appHeight: string
  kbInset: string
  kbRange: string
  /** `false` while `--kb-inset` is the remembered height standing in for a measurement. */
  kbMeasured: boolean
  keyboardAttr: boolean
  scroller: string
  scrollTop: number
  scrollMax: number
  padBottom: number
  htmlRectTop: number
  rootRectTop: number
  visibleBottom: number
  headerTop: number
  headerBottom: number
  footerTop: number
  bandTop: number
  bandBottom: number
  focused: string
  focusedTop: number
  focusedBottom: number
  fieldInScroller: boolean
  revealDelta: number
  stored: string
  at: number
}

const round = (value: number | undefined, fallback = -1) =>
  value === undefined ? fallback : Math.round(value)

const px = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * The node the reveal is attached to, preferring the one holding the focused field — `AppScreen`,
 * `AuthScreen` and every open `CardFace` attach their own.
 */
function revealScroller(active: Element | null): HTMLElement | null {
  const owner = active?.closest(`[${REVEAL_SCROLL_ATTR}]`)
  if (owner instanceof HTMLElement) return owner
  const first = document.querySelector(`[${REVEAL_SCROLL_ATTR}]`)
  return first instanceof HTMLElement ? first : null
}

export function readViewport(): ViewportSample {
  const root = document.documentElement
  const vv = window.visualViewport
  const style = root.style
  const active = document.activeElement
  const attached = revealScroller(active)
  const scroller = attached ?? document.querySelector('main')
  // Exactly the lookups `useKeyboardReveal` makes, so the band below is the band it would use.
  const header =
    scroller?.parentElement?.querySelector(CHROME.header) ?? document.querySelector(CHROME.header)
  const footer = scroller?.querySelector(CHROME.footer)
  const rect = active instanceof HTMLElement ? active.getBoundingClientRect() : undefined
  const headerRect = header?.getBoundingClientRect()
  const scrollerRect = scroller?.getBoundingClientRect()
  const band = {
    top: Math.max(scrollerRect?.top ?? 0, headerRect?.bottom ?? 0),
    bottom: Math.min(
      scrollerRect?.bottom ?? Infinity,
      visibleBottom(),
      footer?.getBoundingClientRect().top ?? Infinity,
    ),
  }
  const fieldInScroller = Boolean(isTextField(active) && scroller?.contains(active))

  return {
    route: window.location.pathname,
    mode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
    layoutHeight: root.clientHeight,
    layoutWidth: root.clientWidth,
    vvHeight: round(vv?.height, 0),
    vvOffsetTop: round(vv?.offsetTop, 0),
    vvScale: vv ? Math.round(vv.scale * 100) / 100 : 1,
    appHeight: style.getPropertyValue('--app-height') || '(unset)',
    kbInset: style.getPropertyValue('--kb-inset') || '(unset)',
    kbRange: style.getPropertyValue('--kb-range') || '(unset)',
    kbMeasured: keyboardIsMeasured(),
    keyboardAttr: root.hasAttribute('data-keyboard'),
    scroller: scroller
      ? `${scroller.tagName.toLowerCase()}${attached ? ' (reveal)' : ' (no reveal)'}`
      : '(none)',
    scrollTop: round(scroller?.scrollTop),
    scrollMax: scroller ? Math.round(scroller.scrollHeight - scroller.clientHeight) : -1,
    padBottom: scroller
      ? Math.round(Number.parseFloat(getComputedStyle(scroller).paddingBottom))
      : -1,
    htmlRectTop: Math.round(root.getBoundingClientRect().top),
    rootRectTop: round(document.getElementById('root')?.getBoundingClientRect().top),
    visibleBottom: Math.round(visibleBottom()),
    headerTop: round(headerRect?.top),
    headerBottom: round(headerRect?.bottom),
    footerTop: round(footer?.getBoundingClientRect().top),
    bandTop: Math.round(band.top),
    bandBottom: Number.isFinite(band.bottom) ? Math.round(band.bottom) : -1,
    focused: active?.tagName.toLowerCase() ?? '(none)',
    focusedTop: round(rect?.top),
    focusedBottom: round(rect?.bottom),
    fieldInScroller,
    revealDelta: fieldInScroller && rect ? Math.round(revealOffset(band, rect)) : 0,
    stored: localStorage.getItem('mindscape.keyboard-height') ?? '(none)',
    at: Date.now(),
  }
}

export interface ProbeCheck {
  id: string
  label: string
  /** `idle` is "nothing to judge yet" — no keyboard, no field — not a pass. */
  state: 'ok' | 'bad' | 'idle'
  detail: string
}

/**
 * Readout says what the numbers are; this says which is the fault. Every check is one rule from
 * ADR 0002 as arithmetic, so a still reading can be pasted into a bug report and read by someone
 * who was not holding the phone.
 */
export function checkViewport(sample: ViewportSample): ProbeCheck[] {
  const app = px(sample.appHeight) || sample.layoutHeight
  const inset = px(sample.kbInset)
  const range = px(sample.kbRange)
  const stored = Number.parseInt(sample.stored, 10)
  const sum = sample.vvOffsetTop + sample.vvHeight + inset
  const slack = sample.scrollMax - sample.scrollTop
  /** Keyboard's own height, screen space — what the inset would be with no pan under it. */
  const keyboard = app - sample.vvHeight
  // Attribute, not inset: a keyboard panned nearly out of the layout viewport is up, and covering
  // almost none of the shell.
  const open = sample.keyboardAttr
  const delta = sample.revealDelta
  const available = delta > 0 ? slack : sample.scrollTop

  return [
    {
      id: 'pan',
      label: 'no pan',
      state: sample.vvOffsetTop === 0 ? 'ok' : 'bad',
      detail:
        sample.vvOffsetTop === 0
          ? 'visualViewport top 0 — the app revealed its own field'
          : `iOS panned ${sample.vvOffsetTop}px: it was left a field to reveal`,
    },
    {
      id: 'field',
      label: 'field in band',
      state: !sample.fieldInScroller ? 'idle' : delta === 0 ? 'ok' : 'bad',
      detail: !sample.fieldInScroller
        ? sample.focused === '(none)' || sample.focused === 'body'
          ? 'no field focused'
          : `${sample.focused} is not inside the reveal scroll body`
        : delta === 0
          ? `inside ${sample.bandTop}…${sample.bandBottom}`
          : `${Math.abs(delta)}px ${delta < 0 ? 'above' : 'below'} the band ${sample.bandTop}…${sample.bandBottom}`,
    },
    {
      // The reveal is `node.scrollTop += delta`, nothing more: without room to move it writes a
      // number the scroller clamps away, and iOS finishes the job by panning.
      id: 'slack',
      label: 'scroll range',
      state: delta === 0 ? 'idle' : available >= Math.abs(delta) ? 'ok' : 'bad',
      detail:
        delta === 0
          ? `${slack}px below, ${sample.scrollTop}px above`
          : available >= Math.abs(delta)
            ? `${available}px ${delta > 0 ? 'below' : 'above'}, needs ${Math.abs(delta)}px`
            : `clamped: ${available}px ${delta > 0 ? 'below' : 'above'} of the ${Math.abs(delta)}px the reveal needs`,
    },
    {
      id: 'padding',
      label: '.pb-keyboard',
      state: !open ? 'idle' : sample.padBottom >= range ? 'ok' : 'bad',
      detail: !open
        ? 'keyboard closed'
        : sample.padBottom >= range
          ? `padding-bottom ${sample.padBottom} ≥ --kb-range ${range}`
          : `padding-bottom ${sample.padBottom} < --kb-range ${range}: this scroll body has no keyboard range`,
    },
    {
      // Not "is the inset large enough" — under a pan an inset below the remembered height is
      // *correct*, and comparing the two is what let the fault below read as clean. Asks the one
      // question a still reading cannot answer for itself: measurement, or reserve?
      id: 'inset',
      label: 'keyboard measured',
      state: !open ? 'idle' : sample.kbMeasured ? 'ok' : 'bad',
      detail: !open
        ? 'keyboard closed'
        : sample.kbMeasured
          ? sample.vvOffsetTop === 0
            ? `${inset}px measured`
            : `${inset}px of a ${keyboard}px keyboard: the other ${sample.vvOffsetTop}px is panned out of the layout viewport`
          : `${inset}px reserved${Number.isFinite(stored) ? ` from the remembered ${stored}px` : ''}: the keyboard never reported itself, so the reveal band sits ${sum - app}px above the screen`,
    },
    {
      // The only check that catches a live reserve: `--kb-inset` balances by construction *while it
      // is a measurement*, so the two states it breaks in — a reserve that never became one, and a
      // sample read mid-resize — are exactly the two worth catching. Not a tautology; verified on
      // device 2026-07-31.
      id: 'balance',
      label: 'top+vv+kb',
      state: sum === app ? 'ok' : 'bad',
      detail:
        sum === app
          ? `${sum} = --app-height`
          : !sample.kbMeasured
            ? `${sum} ≠ ${app}: --kb-inset is the reserve, and the keyboard under it covers ${Math.max(0, keyboard - sample.vvOffsetTop)}px`
            : `${sum} ≠ ${app}: read ${sum - app}px mid-resize — --kb-inset is a frame behind visualViewport`,
    },
    {
      id: 'chrome',
      label: 'shell anchored',
      state: sample.htmlRectTop === 0 && sample.rootRectTop === 0 ? 'ok' : 'bad',
      detail:
        sample.htmlRectTop === 0 && sample.rootRectTop === 0
          ? 'html and #root at 0'
          : `#root at ${sample.rootRectTop}: the shell slid, rects carry the pan`,
    },
    {
      id: 'scroller',
      label: 'reveal attached',
      state: sample.scroller.includes('(reveal)') ? 'ok' : 'bad',
      detail: sample.scroller.includes('(reveal)')
        ? `${sample.scroller} owns the reveal`
        : `${sample.scroller}: no useKeyboardReveal on this scroll body`,
    },
    {
      id: 'zoom',
      label: 'unzoomed',
      state: sample.vvScale === 1 ? 'ok' : 'bad',
      detail:
        sample.vvScale === 1
          ? 'scale 1'
          : `scale ${sample.vvScale}: measurement is frozen until the zoom is released`,
    },
  ]
}

/**
 * One keyboard, from the resting reading it interrupted to the one it settled into. The pair is the
 * unit worth reading: every number here is a difference — pan, inset, rects, scroll position — so a
 * lone reading forces whoever gets it to guess the other half.
 */
export interface KeyboardEpisode {
  /** Last reading with no keyboard and no reserve. `null` if the probe started mid-open. */
  before: ViewportSample | null
  /**
   * The frame the keyboard **settled** on — the last open one whose numbers agree. Emphatically not
   * the last open frame: iOS dismisses over several frames and the probe samples faster than the
   * module re-measures, so the final frame carrying an inset is one frame into the close, a restored
   * `visualViewport` against a stale inset. Four of the first five device readings were that frame,
   * and every verdict on them was noise.
   */
  after: ViewportSample
  /** Still on screen: `after` is this keyboard's own reading, not the one it closed on. */
  live: boolean
}

export function isKeyboardOpen(sample: ViewportSample): boolean {
  return sample.keyboardAttr
}

/**
 * Do a reading's three viewport numbers agree? They are one identity — pan + visual viewport +
 * inset = the anchored shell — so a reading that breaks it was taken mid-resize (fresh
 * `visualViewport`, inset a frame behind) or on a reserve that never became a measurement. Neither
 * describes the keyboard that was up.
 */
export function isSettled(sample: ViewportSample): boolean {
  const app = px(sample.appHeight) || sample.layoutHeight
  return sample.vvOffsetTop + sample.vvHeight + px(sample.kbInset) === app
}
