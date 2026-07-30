# ADR 0002 — The shell is anchored to the screen; the keyboard covers it

- **Status:** accepted · **Date:** 2026-07-27
- **Supersedes:** the shrink-to-fit viewport design (`#root` sized to `--vvh` and re-anchored to `--vv-top`)
- **Amended:** 2026-07-30
  by [the keyboard-chrome spec](../superpowers/specs/2026-07-30-keyboard-chrome-design.md), then twice more the same day
  on device. The end state reverses the middle ones: **the app no longer compensates for the pan at all.** `--vv-top`,
  `--pan-comp`, `--pan-pad`, `.pt-pan`, the chrome `translate`, the fixed probe, `classify()` and `subscribePan` are
  deleted; the scroll range gained the reveal gap that was provoking the pan in the first place. Amended bullets are
  marked below, and the superseded ones are gone rather than left to be re-read as current.

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
- **Nothing in the app compensates for the pan. The pan is prevented instead** _(amended 2026-07-30, third pass — this
  replaces four bullets of compensation machinery, and the machinery is deleted, not disabled)_. iOS pans to reveal the
  focused field **only when the page has not revealed it itself**. Every version of the compensation — a `display-mode`
  gate, then `isPanBakedIntoRects()`, then a hidden fixed probe and `classify()`, with `--vv-top`, `--pan-comp`,
  `--pan-pad` and `.pt-pan` hanging off them — was an attempt to survive a pan the app was provoking. Each one traded a
  symptom for another (a header diving over the content, a header dragged by a finger, a keyboard-shaped hole, a
  scrollable gap above the page), because compensation and the platform's own reveal are two controllers fighting over
  the same geometry.
  **The provocation was scroll range.** `.pb-keyboard` published `padding-bottom: var(--kb-inset)`, which lets a scroll
  body lift its last field _up to_ the keyboard's edge and no further — `scrollTop` clamps at the end of the content —
  so a field near the bottom of a page stayed under the keyboard and iOS panned to finish the job. That is why the
  first field of a form behaved and the third did not. The range is now `--kb-range` = `--kb-inset + REVEAL_GAP`, the
  same gap `useKeyboardReveal` aims for, published by the same module so the two cannot drift.
  With the pan gone, the keyboard-open and keyboard-closed cases are the same code path: chrome sits where it always
  sits, and the keyboard costs padding at the bottom of one scroll body. **If a pan does happen, the whole shell slides
  as one and slides back on blur** — visible, undramatic, and no longer something the app tries to out-guess.
- **`visibleBottom()` is the only bridge between the two coordinate spaces**, and it survives the deletion because it
  is not compensation: it is `htmlRect.top + --app-height − --kb-inset`, read live. The visible area ends `--kb-inset`
  above the anchored shell's bottom in layout coordinates, and `html`'s rect top says where those coordinates begin in
  rect ones — `0` where rects are layout-relative, `−pan` where they already carry it. Getting the space wrong costs a
  full pan of over-scroll on the very reveal whose accuracy is what keeps iOS from panning.
- **The reveal band is otherwise built from rects only** — the scrollport, `[data-slot="header-bar"]`'s bottom,
  `[data-slot="footer-bar"]`'s top — so the field lands between the chrome, never under either, with no space conversion
  to get wrong.
- `useKeyboardInset` publishes exactly one number, `--kb-inset`, thresholded at 120px so an accessory bar alone never
  reads as a keyboard. It is the single `visualViewport` subscriber; `useVirtualKeyboard` reads the same measurement
  instead of taking a second subscription.
- **The height is news about the keyboard; a scroll frame is news about nothing** _(amended 2026-07-30, third pass —
  this bullet has now said three different things, which is itself the lesson)_. `visualViewport` fires `scroll` on
  every frame of a rubber-band, and reading one has caused every fault this module ever had: the height read mid-flight
  resizes the scroll range under the finger; the pan read mid-flight moved chrome with the finger; the pan read only on
  a settle made chrome lag the scroll and land on lift. **There is no correct sampling rate for a number nothing should
  be positioned from.** With the compensation deleted, `scroll` is not subscribed to at all — the height is re-derived
  on `resize`, and nothing is held at a maximum.
- **The reserve ends at the first measurement, not at blur** _(added 2026-07-30, second pass)_. iOS closes the keyboard
  without blurring the field (the swipe-down, `Done` on the accessory bar), so `expecting` stays true across a
  measurement of zero. Keying the reserve off `expecting` republishes the remembered height forever in that state and
  the page keeps a keyboard-shaped hole under it. It is keyed off its own flag, set on focus and cleared the first time
  a resize measures a real keyboard — after which the measurement rules, including when it says the keyboard is gone.
- **One subscriber set, woken on every resize the app measures** _(amended 2026-07-30, third pass; `subscribePan` is
  deleted along with the pan it published)_. `subscribeKeyboardHeight` fires once per keyboard event, and
  **unconditionally** — not only when the inset moved. A keyboard whose measurement matches the reserve exactly moves
  no inset but still moves the pan, and where the UA reports rects against the visual viewport that is the reveal band
  moving; a wake-up conditional on the inset silently skips the reveal that would have kept iOS from panning.
  Subscribers are idempotent, so the only thing the condition could buy was a missed reveal.
- `useKeyboardReveal` (`shared/lib`) attaches to a scroll node, and on `focusin` of a text field sets `node.scrollTop`
  so the field clears the keyboard by `REVEAL_GAP`, re-running once per keyboard event. **This is now the load-bearing
  part of the whole design**: it is what leaves iOS nothing to reveal. `AppScreen` wires it through its existing scroll ref; `AuthScreen` and `CardFace` opt in.
- Scroll bodies carry `padding-bottom: var(--kb-range)` while the keyboard is up (`.pb-keyboard`, and `.pb-safe` via
  `max()`) — the inset **plus `REVEAL_GAP`** _(amended 2026-07-30, third pass)_. **The padding is not decoration — it is
  the scroll range** the reveal needs to lift the last field, and at exactly `--kb-inset` it is one gap short of being
  able to: `scrollTop` clamps, the field stays against the keyboard's edge, and iOS pans. `scroll-padding-bottom` stays
  the bare `--kb-inset`, which describes where the keyboard is rather than how far past it a field may be lifted.
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

- **The header does not move when the keyboard opens, and neither does anything else** _(added 2026-07-30)_. That is
  the acceptance test for this design, and the four fixes that preceded it all failed it in a different way. If the
  header ever moves again, the question is not "what should compensate for it" but "why did the reveal not clear the
  field".
- **A footer is not reachable without scrolling while typing.** On `PasteNotesPage` the "Create N cards" CTA is behind
  the keyboard until you scroll to the end. `MOBILE_DESIGN` §2/§6 previously demanded it stay above the keyboard and
  were amended — do not "restore" them.
- **`ImportReviewPage`'s "Import N cards" moved from the header to a `FooterBar`**, so both steps of the paste flow
  present their CTA the same way.
- **`/dev/kitchen-sink` carries a live viewport probe** (`KeyboardProbe`): layout vs visual viewport, every published
  variable, the reveal band against the focused field's rect, and whether `offsetTop + visualViewport.height +
--kb-inset` still balances against `--app-height`. **`visualViewport top` is now the headline number** — it should read
  `0`, and anything else means the app failed to reveal its own field and the platform stepped in. It exists because
  none of this is observable where the code is written, and three fixes were shipped on inference before it did.
- **The probe judges the reading, it does not only print it** _(added 2026-07-30, fourth pass)_.
  `checkViewport()` turns each rule above into one pass/fail line — the pan is `0`, the field is inside the band, the
  scroll body has the range the reveal needs, `padding-bottom` ≥ `--kb-range`, the inset is not undercounted by a pan,
  the shell is at `0`, the scroll body has a reveal attached, the page is unzoomed — and `BandDiagram` draws the shell
  to scale with the band, the keyboard and the focused field in it. **`top+vv+kb = --app-height` is not a health
  check**: `--kb-inset` is derived from those three, so it balances by construction and only breaks when the pan moved
  _after_ the last `resize` — read it as "the pan has drifted since we measured", nothing more.
  **A keyboard is copied as a pair, never as a still.** The probe keeps the last `EPISODE_LIMIT` (5) keyboards as
  `{ before, after }` — the resting reading the keyboard interrupted, the reading it settled into, and a diff of every
  row that moved between them. Every number that matters here is a _difference_ (the pan, the inset against the
  remembered height, the rects, `scrollTop`), so a lone reading forces its reader to guess the other half; the pairing
  edge is `--kb-inset > 0`, which the reserve raises on `focusin`, so `before` is the last genuinely resting frame.
  `useKeyboardReveal` marks its scroll node with `data-reveal-scroll` (`REVEAL_SCROLL_ATTR`) so the probe reads the node
  that owns the reveal instead of guessing at `main` — "the field never moved" and "the field moved a node nobody
  watches" are otherwise the same reading. **`copy reading` dumps every row and verdict as text**, and is guarded by
  `keepFieldFocused`, because the reading worth having is the one taken with the keyboard still up.
- **The same probe floats over any route** (`widgets/dev-probe`, Settings → Developer → _Viewport probe overlay_)
  _(added 2026-07-30)_. A keyboard fault only reproduces on the screen that has it, and a still reading does not show
  it — the header-drag bug lived entirely in how the numbers moved against a finger. The overlay records a per-frame
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
