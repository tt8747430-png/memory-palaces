import { describe, expect, it } from 'vitest'
import {
  checkViewport,
  episodesToText,
  isKeyboardOpen,
  isSettled,
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
  kbMeasured: false,
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

  it('names the pan and the unrevealed field, and passes the inset the pan shrank', () => {
    // The reading from the device: iOS panned 223 of a 403px keyboard, leaving 180px of the shell
    // covered. That inset is *correct* — comparing it to the remembered full height instead is what
    // made the probe call a healthy measurement a fault, and a live reserve clean.
    const checks = checkViewport(
      sample({
        vvHeight: 390,
        vvOffsetTop: 223,
        kbInset: '180px',
        kbRange: '204px',
        kbMeasured: true,
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
    expect(verdict(checks, 'inset').state).toBe('ok')
    expect(verdict(checks, 'inset').detail).toContain('223px is panned out')
    expect(verdict(checks, 'chrome').state).toBe('bad')
    // Pan + visual viewport + inset is the whole shell, so a measurement always balances.
    expect(verdict(checks, 'balance').state).toBe('ok')
  })

  it('catches the reserve the keyboard never replaced, and says how far off the band is', () => {
    // The device reading this whole check exists for: a 403px keyboard under a 289px pan measured
    // 114, which the accessory-bar floor rejected, so `--kb-inset` stayed the remembered 462 for the
    // entire keyboard and `visibleBottom()` put the reveal band 348px above the screen.
    const checks = checkViewport(
      sample({
        vvHeight: 390,
        vvOffsetTop: 289,
        kbInset: '462px',
        kbRange: '486px',
        kbMeasured: false,
        keyboardAttr: true,
        htmlRectTop: -289,
        rootRectTop: -289,
        visibleBottom: 42,
        bandTop: -108,
        bandBottom: 42,
        padBottom: 486,
        focused: 'input',
        fieldInScroller: true,
        stored: '462',
      }),
    )
    expect(verdict(checks, 'inset').state).toBe('bad')
    expect(verdict(checks, 'inset').detail).toContain('reserved from the remembered 462px')
    expect(verdict(checks, 'inset').detail).toContain('348px above the screen')
    expect(verdict(checks, 'balance').state).toBe('bad')
    expect(verdict(checks, 'balance').detail).toContain('covers 114px')
  })

  it('reports a reading taken mid-resize as a balance drift, without blaming a pan for it', () => {
    const checks = checkViewport(
      sample({
        vvHeight: 390,
        vvOffsetTop: 11,
        kbInset: '403px',
        kbRange: '427px',
        kbMeasured: true,
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
    expect(verdict(checks, 'balance').detail).toContain('11px mid-resize')
    expect(verdict(checks, 'inset').state).toBe('ok')
    expect(verdict(checks, 'field').detail).toContain('207px above')
  })

  it('does not call a straddled resize a pan when the reading says the pan is zero', () => {
    // Four of the first five device readings: the viewport is back to full height and `--kb-inset`
    // is a frame behind it. Every verdict that named a pan there was naming one the sample denies.
    const checks = checkViewport(
      sample({ kbInset: '403px', kbRange: '427px', kbMeasured: true, keyboardAttr: true }),
    )
    expect(verdict(checks, 'pan').state).toBe('ok')
    expect(verdict(checks, 'inset').detail).not.toContain('pan')
    expect(verdict(checks, 'balance').state).toBe('bad')
    expect(verdict(checks, 'balance').detail).not.toContain('pan')
  })

  it('fails the scroll range when the body is clamped short of the reveal', () => {
    const clamped = sample({
      kbInset: '403px',
      kbRange: '427px',
      vvHeight: 390,
      kbMeasured: true,
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
      sample({
        kbInset: '403px',
        kbRange: '427px',
        kbMeasured: true,
        keyboardAttr: true,
        padBottom: 12,
      }),
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
  it('reads the attribute, so the reserve counts and a fully panned keyboard is not lost', () => {
    expect(isKeyboardOpen(RESTING)).toBe(false)
    expect(isKeyboardOpen(sample({ kbInset: '403px', keyboardAttr: true }))).toBe(true)
    // The pan can leave nothing of the shell covered; the keyboard is still up.
    expect(isKeyboardOpen(sample({ kbInset: '0px', keyboardAttr: true }))).toBe(true)
  })
})

describe('isSettled', () => {
  it('holds when the pan, the visual viewport and the inset add up to the shell', () => {
    expect(isSettled(RESTING)).toBe(true)
    expect(
      isSettled(sample({ vvHeight: 390, vvOffsetTop: 289, kbInset: '114px', kbMeasured: true })),
    ).toBe(true)
  })

  it('rejects the frame a keyboard is dismissed on, and a reserve nothing measured', () => {
    // Viewport restored, inset a frame behind it.
    expect(isSettled(sample({ vvHeight: 793, kbInset: '403px', keyboardAttr: true }))).toBe(false)
    // The reserve, with the real keyboard under it 348px smaller.
    expect(
      isSettled(sample({ vvHeight: 390, vvOffsetTop: 289, kbInset: '462px', keyboardAttr: true })),
    ).toBe(false)
  })
})

describe('episodesToText', () => {
  const OPEN = sample({
    vvHeight: 390,
    vvOffsetTop: 223,
    kbInset: '180px',
    kbRange: '204px',
    kbMeasured: true,
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
