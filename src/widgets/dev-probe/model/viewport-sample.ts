import {
  CHROME,
  isTextField,
  keyboardIsMeasured,
  readStatusBarPaint,
  revealOffset,
  statusBarIsDeclared,
  statusBarIsPainted,
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
  statusBarDeclared: string
  statusBarMeta: string
  statusBarPainted: string
  at: number
}

const round = (value: number | undefined, fallback = -1) =>
  value === undefined ? fallback : Math.round(value)

const px = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

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
  const statusBar = readStatusBarPaint()

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
    statusBarDeclared: statusBar.declared || '(unset)',
    statusBarMeta: statusBar.meta || '(none)',
    statusBarPainted: statusBar.painted || '(nothing painted)',
    at: Date.now(),
  }
}

export interface ProbeCheck {
  id: string
  label: string
  state: 'ok' | 'bad' | 'idle'
  detail: string
}

export function checkViewport(sample: ViewportSample): ProbeCheck[] {
  const app = px(sample.appHeight) || sample.layoutHeight
  const inset = px(sample.kbInset)
  const range = px(sample.kbRange)
  const stored = Number.parseInt(sample.stored, 10)
  const sum = sample.vvOffsetTop + sample.vvHeight + inset
  const slack = sample.scrollMax - sample.scrollTop
  const keyboard = app - sample.vvHeight
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
      id: 'status-bar',
      label: 'status bar',
      state: statusBarState(sample),
      detail: statusBarDetail(sample),
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
 * The bar is the platform's to paint, from `theme-color` or — where that is not honoured — from
 * whatever the page leaves under it. Both answers have to be the token's, or the theme breaks at
 * the top of the screen with nothing in the app looking wrong.
 */
function statusBarPaint(sample: ViewportSample) {
  return {
    declared: sample.statusBarDeclared === '(unset)' ? '' : sample.statusBarDeclared,
    meta: sample.statusBarMeta === '(none)' ? '' : sample.statusBarMeta,
    painted: sample.statusBarPainted === '(nothing painted)' ? '' : sample.statusBarPainted,
  }
}

function statusBarState(sample: ViewportSample): ProbeCheck['state'] {
  const paint = statusBarPaint(sample)
  if (!paint.declared) return 'idle'
  return statusBarIsDeclared(paint) && statusBarIsPainted(paint) ? 'ok' : 'bad'
}

function statusBarDetail(sample: ViewportSample): string {
  const paint = statusBarPaint(sample)
  if (!paint.declared) return 'no --status-bar token on the document'
  if (!statusBarIsDeclared(paint)) {
    return `theme-color is ${paint.meta || 'missing'}, the token says ${paint.declared}`
  }
  if (!paint.painted) {
    return `nothing opaque under the top edge: a platform that samples paints its own ${paint.declared} guess`
  }
  if (!statusBarIsPainted(paint)) {
    return `${paint.painted} sits under the bar, not ${paint.declared} — a sampling platform follows the pixels`
  }
  return `${paint.declared}, told and painted`
}

export interface KeyboardEpisode {
  before: ViewportSample | null
  after: ViewportSample
  live: boolean
}

export function isKeyboardOpen(sample: ViewportSample): boolean {
  return sample.keyboardAttr
}

export function isSettled(sample: ViewportSample): boolean {
  const app = px(sample.appHeight) || sample.layoutHeight
  return sample.vvOffsetTop + sample.vvHeight + px(sample.kbInset) === app
}
