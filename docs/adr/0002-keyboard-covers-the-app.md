# ADR 0002 — The shell is anchored to the screen; the keyboard covers it

- **Status:** accepted · **Date:** 2026-07-27
- **Supersedes:** the shrink-to-fit viewport design (`#root` sized to `--vvh` and re-anchored to `--vv-top`)
- **Amended:** 2026-07-30
  by [the keyboard-chrome spec](../superpowers/specs/2026-07-30-keyboard-chrome-design.md) — the pan is no longer held
  at the episode maximum, and chrome consumes a measured `--pan-comp` rather than `--vv-top` behind a `display-mode`
  gate (inferred). Amended again the same day, on device: **the pan is published per frame after all**, and the rule
  that keeps a finger from dragging chrome is that only a `translate` may read the per-frame value — layout reads
  `--pan-pad`, which waits for the settle. Amended bullets are marked below.

## Context

`#root` was `position: fixed; inset: var(--vv-top) 0 auto 0; height: var(--vvh)` — the whole app shrank to the _visual_
viewport and re-anchored to it on every viewport event. It fitted the keyboard exactly, which meant a `FooterBar` (the
last `shrink-0` child of `AppScreen`'s column) always came to rest on the keyboard's top edge.

That produced three faults on device, all from the same source:

1. **The footer rode up with the keyboard.** Unavoidable: it is the bottom of a shell whose bottom _is_ the keyboard.
2. **The page dropped and snapped back** when focus moved to a field near the keyboard. iOS reveals an occluded field by
   panning the visual viewport (`visualViewport.offsetTop` > 0). We reacted by moving and resizing `#root` to match —
   which revealed the field a second time, so iOS un-panned, so we moved back. A geometry feedback loop, one full cycle
   per focus. **The loop is entered by anything that re-lays-out content in response to the pan** — the pan itself is
   not the fault.
3. **Focusing the fourth field just opened the keyboard.** Nothing in the app ever scrolled a focused field into view.
   `AppScreen` published no `scroll-padding`, and with `html`/`body` at `overflow: hidden` the document cannot scroll,
   so the only mechanism that ever revealed anything was the iOS pan from (2).

### What iOS actually does (verified, not assumed)

Two rounds of fixes failed because this was inferred rather than checked. It is now settled:

- **The layout viewport does not resize.** Only the visual viewport shrinks. Measured on device: layout `793` before and
  during the keyboard, `visualViewport.height` `390`, `offsetTop` `113`.
- **Safari _pans_ the visual viewport** (`visualViewport.offsetTop` > 0) to reveal the focused field, and does not
  un-pan until blur.
- **Whether WebKit re-anchors `position: fixed` to the _visual_ viewport depends on display mode.** In a Safari _tab_ it
  does — the probe that measured layout `793` (= 852 − 59 of Safari chrome) saw a focused field at `top: 57` while
  `--vv-top` was `113`, so the fixed root stayed on screen and rects carried the pan. In the **installed standalone PWA
  ** (layout `852`) it does **not**: device screenshots (2026-07-28) show the fixed root riding off the top by the full
  pan, header gone. The two earlier "contradictory" observations were both real — they were taken in different display
  modes. Compensation is therefore gated on `@media (display-mode: standalone)`.
- **WebKit keyboard-avoids _bottom-anchored_ fixed/sticky boxes regardless.** The same standalone screenshots show a
  `sticky bottom-0` dock re-clamped to the visual viewport bottom — floating above the keyboard mid-screen — instead of
  resting at the scrollport bottom behind it. A `static` box is invisible to that mechanism, which is why the footer
  dock unsticks while the keyboard is up (below).

> **The trap:** `visualViewport.offsetTop` and `getBoundingClientRect()` are **different coordinate spaces**. Mixing
> them silently double-counts the pan. Two fixes were lost to it — a header translated by `--vv-top` (already on screen,
> so it moved _down_ over the content) and a reveal band whose bottom was `--app-height − --kb-inset` (`503`) when the
> visible area actually ended at `390`, parking fields 113px under the keyboard and provoking the very pan we were
> compensating for.

- **`interactive-widget` is unimplemented in WebKit as of iOS 26
  ** ([WebKit #259770](https://bugs.webkit.org/show_bug.cgi?id=259770)). The `interactive-widget=resizes-visual` in
  `index.html` is inert on iOS; we cannot ask the platform not to pan, and `overlays-content` is not available to opt
  out of the shrink either. It is handled in JS or not at all.
- **`resizes-visual` is nonetheless declared on purpose, and is load-bearing where it _is_ implemented.** It is the spec
  default ([css-viewport-1 §interactive-widget](https://drafts.csswg.org/css-viewport-1/#interactive-widget-section)),
  so it reads as removable boilerplate — it is not. Chrome 108+ and Firefox 132+ honour the keyword, and under
  `resizes-content` the layout viewport shrinks _with_ the visual one, so `--app-height − visualViewport.height −
offsetTop` collapses to ~0 and the keyboard is never detected: no `--kb-inset`, no scroll range, no reveal. Stating
  `resizes-visual` is what keeps Android on the same measurement iOS forces us into. **Do not "modernise" it.**
- **Pinch-zoom is indistinguishable from the keyboard by geometry alone.** `visualViewport.height` shrinks and
  `offsetTop` pans for _both_ ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)); `scale` is the
  only discriminator. WebKit ignores our `user-scalable=no` for accessibility, so a zoomed reading is reachable on the
  exact platform this code exists for — a two-finger zoom would otherwise publish a full-height `--kb-inset`,
  `data-keyboard`, and a header translate with no keyboard on screen. `measure()` therefore returns early while
  `vv.scale !== 1`, freezing the last unzoomed values; anchoring runs before the guard because pinch-zoom never touches
  the layout viewport. (Base UI's drawer keyboard provider takes the same guard.)

So the pan is a given. In a Safari tab nothing may compensate for it — the platform already has. In the standalone PWA
the platform has not, and the only permitted compensation is a `translate` on chrome, which moves no field and so cannot
feed back into Safari's reveal decision. The only arithmetic that bridges the two coordinate spaces is
`visibleBottom()`.

## Decision

**The app is anchored to the screen, not to the viewport. The keyboard covers its bottom. The scroll body — not the
shell, and not iOS — is what reveals the focused field.**

- **`--app-height` is the layout viewport measured while no field is focused, and held there.** `#root` is
  `position: fixed; top: 0; height: var(--app-height)`. It re-anchors on a width change (rotation) and when the viewport
  grows, never while `expectKeyboard(true)` is in force. So the shell keeps its box across a keyboard: nothing reflows,
  and its bottom edge stays the real screen bottom, behind the keyboard.
- **Every keyboard measurement uses `--app-height` as the denominator**, never live `clientHeight`. `--vvh` is deleted.
  **Chrome consumes `--pan-comp` while the keyboard is up, and only via `translate`**: `theme.css` rides
  `[data-slot="header-bar"]` and `[data-slot="status-cap"]` back onto the screen under `[data-keyboard]`.
  _(Amended 2026-07-30.)_ `--pan-comp` is the part of the pan the platform has **not** already compensated for — the
  full pan where the UA leaves fixed boxes at the layout origin, `0` where it re-anchored them to the visual viewport
  itself — so the rule is a no-op in a Safari tab without needing a `display-mode` gate to say so. The gate was a proxy
  for a behaviour, and it classified Chrome iOS, Firefox iOS and every future UA by guess.
- **The compensation is measured on a fixed box, because that is the box that rides** _(amended 2026-07-30, second
  pass)_. The first measured version read `html` alone and called the pan "baked into rects" when
  `|htmlRect.top + vv.offsetTop| < 1`. That conflates two independent questions — _which space are rects in_ and _did
  fixed boxes move_ — and `html` only answers the first: it sits at the layout origin whether or not the UA lifted
  fixed boxes off it. A UA that re-anchors the shell but keeps reporting rects layout-relative therefore read as
  "not compensated", and the header was translated down over the content by the full pan on every focus that panned.
  `startKeyboardViewport` now appends one hidden, never-translated `position: fixed; top: 0` probe to `body`, and
  `classify()` compares `pan + htmlRect.top` — where the visible viewport starts in rect coordinates — against
  `probeRect.top`, where a fixed box actually landed. Both come from `getBoundingClientRect()`, so nothing crosses
  coordinate spaces; all four combinations of the two questions come out right, and no UA is classified by name.
- **Chrome that rides the pan drags the scroll body with it, or it eats the top of the page.** The translate moves the
  header alone; the scroll body stays where the ride-off left it, so the first `--pan-pad` of content sits _behind_ the
  header and **cannot be scrolled out from under it — the page is already at `scrollTop: 0`**. `.pt-pan` gives the
  scrollport the same offset as padding under the same gate, so content begins below the translated header and the range
  to scroll back up to it exists. It ships in `SCREEN_SCROLL` (`shared/lib`) so a scroll surface cannot be built without
  it; the surfaces that opted out by hand were the ones whose headers covered their content. It is the one place a layout property may consume the pan: it is range, not a reveal,
  and `useKeyboardReveal` — which re-runs on every pan change — is what then puts the focused field back above the
  keyboard. Without that pairing the padding would hand the field back to the position Safari panned away from.
- **`visibleBottom()` is the single bridge between the two spaces**, and it is `originTop + --app-height − --kb-inset`
  _(amended 2026-07-30, second pass)_. The visible area ends `--kb-inset` above the anchored shell's bottom in layout
  coordinates; `originTop` (`htmlRect.top`, sampled with the pan) is where those coordinates begin in rect ones — `0`
  where rects are layout-relative, `−pan` where they already carry it. That is the same two answers the old pair of
  formulas gave, from the one measurement, instead of a branch on a boolean that also had to be right about fixed
  boxes. Getting the space wrong costs a full pan of over-scroll on every revealed field. With no pan the two spaces
  coincide, so `originTop` is 0 by definition and no rect is read at all — the reserve phase, where the keyboard has
  not reported itself yet, is covered by that.
- **The reveal band is otherwise built from rects only** — the scrollport, `[data-slot="header-bar"]`'s bottom,
  `[data-slot="footer-bar"]`'s top — so the field lands between the chrome, never under either, with no space conversion
  to get wrong.
- `useKeyboardInset` publishes exactly one number, `--kb-inset`, thresholded at 120px so an accessory bar alone never
  reads as a keyboard. It is the single `visualViewport` subscriber; `useVirtualKeyboard` reads the same measurement
  instead of taking a second subscription.
- **The height is news about the keyboard; the pan is news about the screen** _(amended 2026-07-30, third pass — this
  bullet previously said a scroll frame carries no pan worth publishing, and that was wrong)_. `visualViewport` fires
  `scroll` on every frame of a rubber-band. The **height** is re-derived on `resize` only, and nothing is held at a
  maximum — the old `Math.max` damping left chrome parked below the top of the screen until blur. The **pan** is
  published from every frame of both events: the shell is anchored to the layout viewport and the screen shows the
  visual one, so a rubber-band moves the shell on screen exactly as a keyboard pan does, and chrome pinned to the
  screen has to be re-offset as often as that happens. Damping it to the settle is visible on device — the header
  lags the scroll and only lands when the finger lifts.
- **What must not follow a finger is layout, not the transform** _(added 2026-07-30, third pass)_. The original
  "chrome follows the finger" fault was per-frame publishing feeding a scrollport's `padding-top`, which moves content
  under the finger and drags the scroll offset with it. The number is therefore published twice, split by what may
  consume it: `--pan-comp` every frame, readable only by a `translate`; `--pan-pad` held at the last settled value, the
  only one `.pt-pan` may read. Between settles the padding is stale by the distance of the current gesture — it costs
  range at the top of the scrollport and nothing else.
- **Which space the platform puts fixed boxes in is classified on a settle, not per frame** _(added 2026-07-30, third
  pass)_. The measurement is two `getBoundingClientRect()` calls, and forcing a layout flush on every frame of a drag
  is the other half of "the page you type in scrolls worse than one you don't". `classify()` runs on a `resize` or a
  settled scroll and leaves a sticky boolean; drag frames derive the compensation from it arithmetically. It is sticky
  because it describes the platform rather than the moment, and it defaults to **not** compensating — chrome that has
  not been shown to be off-screen must never be moved.
- **The reserve ends at the first measurement, not at blur** _(added 2026-07-30, second pass)_. iOS closes the keyboard
  without blurring the field (the swipe-down, `Done` on the accessory bar), so `expecting` stays true across a
  measurement of zero. Keying the reserve off `expecting` republishes the remembered height forever in that state and
  the page keeps a keyboard-shaped hole under it. It is keyed off its own flag, set on focus and cleared the first time
  a resize measures a real keyboard — after which the measurement rules, including when it says the keyboard is gone.
- **`notifyKeyboard` compares against what was last announced, not against what the current call wrote**
  _(added 2026-07-30, second pass)_. With the pan published live, a `resize` can find both numbers already correct and
  wake nobody — an opening keyboard whose measurement matches the reserve exactly leaves the reveal never re-run
  against the new pan. One wake-up per keyboard event, and none for an event that moved nothing, is the rule; which
  write got there first is not the reveal's business.
- **Height and pan have separate subscriber sets** _(amended 2026-07-30)_. `subscribeKeyboardHeight` fires **once per
  keyboard event** — the inset changing, or the pan changing _with_ it on a `resize`, coalesced into one wake-up because
  an opening keyboard moves both in the same frame. `subscribePan` fires on **every** published pan — which is now
  every frame the viewport moves, a drag included. Anything that writes `scrollTop` or touches layout takes the height
  instead: woken by a scroll-produced pan it re-scrolls mid-drag, over the scroll the user is performing.
- `useKeyboardReveal` (`shared/lib`) attaches to a scroll node, and on `focusin` of a text field sets `node.scrollTop`
  so the field clears the keyboard by `REVEAL_GAP`, re-running once per keyboard event — **never on a pan the page
  produced by scrolling**. `AppScreen` wires it through its existing scroll ref; `AuthScreen` and `CardFace` opt in.
- Scroll bodies carry `padding-bottom: var(--kb-inset)` while the keyboard is up (`.pb-keyboard`, and `.pb-safe` via
  `max()`). **The padding is not decoration — it is the scroll range** the reveal needs to lift the last field.
  `scroll-padding-bottom` alone creates none.
- **A page footer is `sticky bottom-0` inside the scroll body** (`AppScreen`'s `FOOTER_DOCK`) — a header, upside down:
  pinned to the bottom with content passing behind it, resting at its flow position once you reach the end. **While the
  keyboard is up it goes `static`** (`[[data-keyboard]_&]:static`, driven by the `data-keyboard` attribute
  `useKeyboardInset` publishes alongside `--kb-inset`): WebKit re-clamps bottom-anchored sticky boxes to the visual
  viewport when the keyboard shows, which would float the dock above the keyboard mid-screen — a static box gives WebKit
  nothing to lift, so the CTA simply sits at the end of the page, behind the keyboard until you scroll to it. The
  `--kb-inset` padding is then scroll range past the footer's flow position. `sticky` (keyboard closed) is only safe
  because of the anchor — pinned to a scrollport the keyboard can shrink, it would come to rest on the keyboard's edge.
  **`AppNav` is `fixed`, so it has no `static` to fall back to and hides outright** (`in-data-keyboard:hidden`)
  _(amended 2026-07-30)_ — WebKit lifts it to the visual viewport bottom otherwise, floating a nav bar across the
  middle of the screen being typed into.
- **A control tapped while a field is focused is guarded by the bar it sits in, not by its author** _(amended
  2026-07-30)_. `keepFieldFocused` moved from `drawer.tsx` to `shared/lib` and is installed by `HeaderBar` and
  `FooterBar`, so a page action inherits it. Left to callers it was applied on sheets and nowhere else, and a header
  action tapped mid-typing dropped the keyboard, released the translate and moved its own target out from under the
  finger.
- **The home-indicator gutter is clearance, not decoration — and it is never reduced by the keyboard**
  _(amended 2026-07-30; this bullet previously said the opposite and contradicted CODE_STYLE §11)_.
  `--app-bottom-inset` is `max(0.75rem, env(safe-area-inset-bottom))`. Subtracting `--kb-inset` only makes bottom chrome
  twitch on keyboard open: nothing bottom-anchored is still on screen to save room for, because the footer dock has gone
  `static` and `AppNav` is hidden.
- The **largest** measured keyboard height is persisted to `localStorage`. `focusin` fires _before_ the keyboard reports
  itself, so the reveal reserves the remembered height up front — and **the real measurement then replaces it outright,
  never `max()`ed with it**. The reserve is a bridge across one frame, not a floor: a measurement taken while iOS has
  panned is legitimately smaller than the same keyboard measured unpanned (the pan moves part of the covered area out of
  the layout viewport), so clamping to the remembered height leaves a dead band the height of the pan under the footer.
  Storing the largest is what keeps the one-frame reserve from undershooting a full keyboard.

## Consequences

- **A footer is not reachable without scrolling while typing.** On `PasteNotesPage` the "Create N cards" CTA is behind
  the keyboard until you scroll to the end. `MOBILE_DESIGN` §2/§6 previously demanded it stay above the keyboard and
  were amended — do not "restore" them.
- **`ImportReviewPage`'s "Import N cards" moved from the header to a `FooterBar`**, so both steps of the paste flow
  present their CTA the same way.
- **`/dev/kitchen-sink` carries a live viewport probe** (`KeyboardProbe`): layout vs visual viewport, the pan, every
  published variable, the three rects `--pan-comp` is derived from (`html`, `#root`, the hidden fixed probe), and
  whether `offsetTop + visualViewport.height + --kb-inset` still balances against `--app-height`. It exists because none of this is observable where the code is written, and three fixes were shipped
  on inference before it did.
- **The same probe floats over any route** (`widgets/dev-probe`, Settings → Developer → _Viewport probe overlay_)
  _(added 2026-07-30)_. A keyboard fault only reproduces on the screen that has it, and a still reading does not show
  it — the header-drag bug lives entirely in how the numbers move against a finger. The overlay records a per-frame
  trace and copies it as TSV.
- **The probe ships in production builds, on purpose and temporarily.** None of these bugs reproduce outside the
  installed PWA, which needs HTTPS, which rules out a dev server — so a `import.meta.env.DEV` gate hid the diagnostic
  from the only environment that shows the fault. Settings → **Developer** therefore links it in every build. **This
  must be guarded before 1.0 (`NEW_ARCHITECHTURE.md` T11.G)** — gate the section on `useDevMode()`, keep the route
  reachable but unlisted.
- **`--app-height` can go stale against a genuinely smaller viewport** — it only shrinks on a width change, so a
  platform that permanently reduces the layout viewport without rotating (browser chrome expanding in a tab) leaves the
  app hanging below the fold until the next rotation. Accepted: the PWA runs standalone, where that does not happen, and
  the alternative is trusting a number the keyboard is allowed to move.
- **Only one surface may own a scroll-reveal.** Base UI sheets already scroll their own focused field via
  `Drawer.VirtualKeyboardProvider`; `useKeyboardReveal` is deliberately opt-in per scroll node rather than a global
  `focusin` listener, so the two can never fight. It also guards its own re-entrancy: `expectKeyboard` notifies
  subscribers, and without the guard `focusin` would scroll twice.
