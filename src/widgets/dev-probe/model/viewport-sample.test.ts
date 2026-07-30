import { describe, expect, it } from 'vitest'
import {
  checkViewport,
  episodesToText,
  isKeyboardOpen,
  sampleToText,
  type KeyboardEpisode,
  type ProbeCheck,
  type ViewportSample,
} from './viewport-sample'

/** A healthy reading: anchored shell, no keyboard, nothing focused. */
const RESTING: ViewportSample = {
  route: '/library',
  mode: 'standalone',
  layoutHeight: 793,
  layoutWidth: 393,
  vvHeight: 793,
  vvOffsetTop: 0,
  vvScale: 1,
  appHeight: '793px',
  kbInset: '0px',
  kbRange: '0px',
  keyboardAttr: false,
  scroller: 'main (reveal)',
  scrollTop: 105,
  scrollMax: 1200,
  padBottom: 12,
  htmlRectTop: 0,
  rootRectTop: 0,
  visibleBottom: 793,
  headerTop: 0,
  headerBottom: 181,
  footerTop: -1,
  bandTop: 181,
  bandBottom: 793,
  focused: 'body',
  focusedTop: 0,
  focusedBottom: 793,
  fieldInScroller: false,
  revealDelta: 0,
  stored: '403',
  at: 0,
}

const sample = (patch: Partial<ViewportSample>): ViewportSample => ({ ...RESTING, ...patch })

const verdict = (checks: ProbeCheck[], id: string) => {
  const check = checks.find((entry) => entry.id === id)
  if (!check) throw new Error(`no check ${id}`)
  return check
}

describe('checkViewport', () => {
  it('passes a resting shell and judges nothing about a keyboard that is closed', () => {
    const checks = checkViewport(RESTING)
    expect(verdict(checks, 'pan').state).toBe('ok')
    expect(verdict(checks, 'balance').state).toBe('ok')
    expect(verdict(checks, 'chrome').state).toBe('ok')
    expect(verdict(checks, 'inset').state).toBe('idle')
    expect(verdict(checks, 'padding').state).toBe('idle')
    expect(verdict(checks, 'field').state).toBe('idle')
  })

  it('names the pan, the unrevealed field and the undercounted keyboard together', () => {
    // The reading from the device: iOS panned 223 and the inset lost exactly that much.
    const checks = checkViewport(
      sample({
        vvHeight: 390,
        vvOffsetTop: 223,
        kbInset: '180px',
        kbRange: '204px',
        keyboardAttr: true,
        htmlRectTop: -223,
        rootRectTop: -223,
        visibleBottom: 390,
        headerTop: -223,
        headerBottom: -42,
        bandTop: -42,
        bandBottom: 390,
        padBottom: 204,
        focused: 'input',
        focusedTop: 2685,
        focusedBottom: 2729,
        fieldInScroller: true,
        revealDelta: 2363,
        scrollTop: 105,
        scrollMax: 1200,
      }),
    )
    expect(verdict(checks, 'pan').state).toBe('bad')
    expect(verdict(checks, 'pan').detail).toContain('223px')
    expect(verdict(checks, 'field').state).toBe('bad')
    expect(verdict(checks, 'field').detail).toContain('2363px below')
    expect(verdict(checks, 'inset').state).toBe('bad')
    expect(verdict(checks, 'inset').detail).toContain('223px pan')
    expect(verdict(checks, 'chrome').state).toBe('bad')
    // Derived from the inset, so it still balances — the check is worth nothing here on purpose.
    expect(verdict(checks, 'balance').state).toBe('ok')
  })

  it('reports a pan that arrived after the last measurement as a balance drift', () => {
    const checks = checkViewport(
      sample({
        vvHeight: 390,
        vvOffsetTop: 11,
        kbInset: '403px',
        kbRange: '427px',
        keyboardAttr: true,
        htmlRectTop: -11,
        rootRectTop: -11,
        visibleBottom: 379,
        headerTop: -11,
        headerBottom: 170,
        bandTop: 170,
        bandBottom: 379,
        padBottom: 427,
        focused: 'input',
        focusedTop: -37,
        focusedBottom: 7,
        fieldInScroller: true,
        revealDelta: -207,
      }),
    )
    expect(verdict(checks, 'balance').state).toBe('bad')
    expect(verdict(checks, 'balance').detail).toContain('11px')
    expect(verdict(checks, 'inset').state).toBe('ok')
    expect(verdict(checks, 'field').detail).toContain('207px above')
  })

  it('fails the scroll range when the body is clamped short of the reveal', () => {
    const clamped = sample({
      kbInset: '403px',
      kbRange: '427px',
      vvHeight: 390,
      keyboardAttr: true,
      fieldInScroller: true,
      focused: 'input',
      revealDelta: 300,
      scrollTop: 1150,
      scrollMax: 1200,
    })
    expect(verdict(checkViewport(clamped), 'slack').state).toBe('bad')
    expect(verdict(checkViewport(clamped), 'slack').detail).toContain('clamped')
    expect(verdict(checkViewport({ ...clamped, scrollMax: 1600 }), 'slack').state).toBe('ok')
  })

  it('fails the padding when the scroll body carries no keyboard range', () => {
    const checks = checkViewport(
      sample({ kbInset: '403px', kbRange: '427px', keyboardAttr: true, padBottom: 12 }),
    )
    expect(verdict(checks, 'padding').state).toBe('bad')
    expect(verdict(checks, 'padding').detail).toContain('no keyboard range')
  })

  it('fails when the measured scroll body has no reveal attached', () => {
    const checks = checkViewport(sample({ scroller: 'main (no reveal)' }))
    expect(verdict(checks, 'scroller').state).toBe('bad')
  })

  it('flags a pinch-zoom, which freezes every other number', () => {
    expect(verdict(checkViewport(sample({ vvScale: 1.6 })), 'zoom').state).toBe('bad')
  })
})

describe('isKeyboardOpen', () => {
  it('reads the published inset, so the reserve counts as open', () => {
    expect(isKeyboardOpen(RESTING)).toBe(false)
    expect(isKeyboardOpen(sample({ kbInset: '403px' }))).toBe(true)
  })
})

describe('episodesToText', () => {
  const OPEN = sample({
    vvHeight: 390,
    vvOffsetTop: 223,
    kbInset: '180px',
    kbRange: '204px',
    keyboardAttr: true,
    htmlRectTop: -223,
    rootRectTop: -223,
    focused: 'input',
    fieldInScroller: true,
    revealDelta: 2363,
    at: 1400,
  })

  const episode = (patch: Partial<KeyboardEpisode> = {}): KeyboardEpisode => ({
    before: RESTING,
    after: OPEN,
    live: false,
    ...patch,
  })

  it('pairs each keyboard with the resting reading it interrupted', () => {
    const text = episodesToText([episode()])
    expect(text).toContain('before (keyboard closed)')
    expect(text).toContain('after (+1400ms)')
    expect(text).toContain('keyboard 1 of 1')
  })

  it('diffs the pair, so what the keyboard moved is stated rather than inferred', () => {
    const text = episodesToText([episode()])
    expect(text).toMatch(/visualViewport top\s+0 → 223/)
    expect(text).toMatch(/--kb-inset\s+0px → 180px/)
    // Unchanged rows stay out of the diff.
    expect(text).not.toMatch(/layout viewport w\s+393 → 393/)
  })

  it('marks the keyboard still on screen and numbers the rest', () => {
    const text = episodesToText([episode(), episode({ live: true })])
    expect(text).toContain('keyboard 1 of 2')
    expect(text).toContain('keyboard 2 of 2 (live)')
  })

  it('says so when the probe started with the keyboard already up', () => {
    const text = episodesToText([episode({ before: null })])
    expect(text).toContain('the probe started with the keyboard already up')
  })

  it('carries the verdicts for the open reading', () => {
    expect(episodesToText([episode()])).toContain('iOS panned 223px')
  })

  it('has something to say before any keyboard has opened', () => {
    expect(episodesToText([])).toContain('no keyboard opened yet')
  })
})

describe('sampleToText', () => {
  it('carries the route, every row and every verdict', () => {
    const text = sampleToText(sample({ vvOffsetTop: 223 }))
    expect(text).toContain('route')
    expect(text).toContain('/library')
    expect(text).toContain('remembered kb')
    expect(text).toContain('FAIL')
    expect(text).toContain('iOS panned 223px')
  })
})
