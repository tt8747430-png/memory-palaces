# ADR 0002 — The shell is anchored to the screen; the keyboard covers it

- **Status:** accepted · **Date:** 2026-07-27
- **Supersedes:** the shrink-to-fit viewport design (`#root` sized to `--vvh` and re-anchored to `--vv-top`)

## Context

`#root` was `position: fixed; inset: var(--vv-top) 0 auto 0; height: var(--vvh)` — the whole app shrank to the _visual_ viewport and re-anchored to it on every viewport event. It fitted the keyboard exactly, which meant a `FooterBar` (the last `shrink-0` child of `AppScreen`'s column) always came to rest on the keyboard's top edge.

That produced three faults on device, all from the same source:

1. **The footer rode up with the keyboard.** Unavoidable: it is the bottom of a shell whose bottom _is_ the keyboard.
2. **The page dropped and snapped back** when focus moved to a field near the keyboard. iOS reveals an occluded field by panning the visual viewport (`visualViewport.offsetTop` > 0). We reacted by moving and resizing `#root` to match — which revealed the field a second time, so iOS un-panned, so we moved back. A geometry feedback loop, one full cycle per focus. **The loop is entered by anything that re-lays-out content in response to the pan** — the pan itself is not the fault.
3. **Focusing the fourth field just opened the keyboard.** Nothing in the app ever scrolled a focused field into view. `AppScreen` published no `scroll-padding`, and with `html`/`body` at `overflow: hidden` the document cannot scroll, so the only mechanism that ever revealed anything was the iOS pan from (2).

### What iOS actually does (verified, not assumed)

Two rounds of fixes failed because this was inferred rather than checked. It is now settled:

- **The layout viewport does not resize.** Only the visual viewport shrinks. Measured on device: layout `793` before and during the keyboard, `visualViewport.height` `390`, `offsetTop` `113`.
- **Safari _pans_ the visual viewport** (`visualViewport.offsetTop` > 0) to reveal the focused field, and does not un-pan until blur.
- **Whether WebKit re-anchors `position: fixed` to the _visual_ viewport depends on display mode.** In a Safari _tab_ it does — the probe that measured layout `793` (= 852 − 59 of Safari chrome) saw a focused field at `top: 57` while `--vv-top` was `113`, so the fixed root stayed on screen and rects carried the pan. In the **installed standalone PWA** (layout `852`) it does **not**: device screenshots (2026-07-28) show the fixed root riding off the top by the full pan, header gone. The two earlier "contradictory" observations were both real — they were taken in different display modes. Compensation is therefore gated on `@media (display-mode: standalone)`.
- **WebKit keyboard-avoids _bottom-anchored_ fixed/sticky boxes regardless.** The same standalone screenshots show a `sticky bottom-0` dock re-clamped to the visual viewport bottom — floating above the keyboard mid-screen — instead of resting at the scrollport bottom behind it. A `static` box is invisible to that mechanism, which is why the footer dock unsticks while the keyboard is up (below).

> **The trap:** `visualViewport.offsetTop` and `getBoundingClientRect()` are **different coordinate spaces**. Mixing them silently double-counts the pan. Two fixes were lost to it — a header translated by `--vv-top` (already on screen, so it moved _down_ over the content) and a reveal band whose bottom was `--app-height − --kb-inset` (`503`) when the visible area actually ended at `390`, parking fields 113px under the keyboard and provoking the very pan we were compensating for.

- **`interactive-widget` is unimplemented in WebKit as of iOS 26** ([WebKit #259770](https://bugs.webkit.org/show_bug.cgi?id=259770)). The `interactive-widget=resizes-visual` in `index.html` is inert on iOS; we cannot ask the platform not to pan, and `overlays-content` is not available to opt out of the shrink either. It is handled in JS or not at all.

So the pan is a given. In a Safari tab nothing may compensate for it — the platform already has. In the standalone PWA the platform has not, and the only permitted compensation is a `translate` on chrome, which moves no field and so cannot feed back into Safari's reveal decision. The only arithmetic that bridges the two coordinate spaces is `visibleBottom()`.

## Decision

**The app is anchored to the screen, not to the viewport. The keyboard covers its bottom. The scroll body — not the shell, and not iOS — is what reveals the focused field.**

- **`--app-height` is the layout viewport measured while no field is focused, and held there.** `#root` is `position: fixed; top: 0; height: var(--app-height)`. It re-anchors on a width change (rotation) and when the viewport grows, never while `expectKeyboard(true)` is in force. So the shell keeps its box across a keyboard: nothing reflows, and its bottom edge stays the real screen bottom, behind the keyboard.
- **Every keyboard measurement uses `--app-height` as the denominator**, never live `clientHeight`. `--vvh` is deleted. **Chrome consumes `--vv-top` only in standalone, only while the keyboard is up, and only via `translate`**: `theme.css` rides `[data-slot="header-bar"]` and `[data-slot="status-cap"]` back onto the screen under `@media (display-mode: standalone)` + `[data-keyboard]`. In a Safari tab the platform re-anchors them itself and the translate would double the pan (the header-dive trap below). A transform moves no field, so Safari's reveal decision cannot oscillate.
- **`visibleBottom()` is the single bridge between the two spaces**: `--app-height − --kb-inset − --vv-top`. That is the bottom of the usable area _in rect coordinates_, and it is the only place the pan appears. Before the keyboard reports itself the pan is 0 and the reserve supplies `--kb-inset`, so the same expression is correct in both phases. **Never compare a raw rect against `--app-height − --kb-inset`.**
- **The reveal band is otherwise built from rects only** — the scrollport, `[data-slot="header-bar"]`'s bottom, `[data-slot="footer-bar"]`'s top — so the field lands between the chrome, never under either, with no space conversion to get wrong.
- `useKeyboardInset` publishes exactly one number, `--kb-inset`, thresholded at 120px so an accessory bar alone never reads as a keyboard. It is the single `visualViewport` subscriber; `useVirtualKeyboard` reads the same measurement instead of taking a second subscription.
- `useKeyboardReveal` (`shared/lib`) attaches to a scroll node, and on `focusin` of a text field sets `node.scrollTop` so the field clears the keyboard by `REVEAL_GAP`, re-running whenever `--kb-inset` changes. `AppScreen` wires it through its existing scroll ref; `AuthScreen` and `CardFace` opt in.
- Scroll bodies carry `padding-bottom: var(--kb-inset)` while the keyboard is up (`.pb-keyboard`, and `.pb-safe` via `max()`). **The padding is not decoration — it is the scroll range** the reveal needs to lift the last field. `scroll-padding-bottom` alone creates none.
- **A page footer is `sticky bottom-0` inside the scroll body** (`AppScreen`'s `FOOTER_DOCK`) — a header, upside down: pinned to the bottom with content passing behind it, resting at its flow position once you reach the end. **While the keyboard is up it goes `static`** (`[[data-keyboard]_&]:static`, driven by the `data-keyboard` attribute `useKeyboardInset` publishes alongside `--kb-inset`): WebKit re-clamps bottom-anchored sticky boxes to the visual viewport when the keyboard shows, which would float the dock above the keyboard mid-screen — a static box gives WebKit nothing to lift, so the CTA simply sits at the end of the page, behind the keyboard until you scroll to it. The `--kb-inset` padding is then scroll range past the footer's flow position. `sticky` (keyboard closed) is only safe because of the anchor — pinned to a scrollport the keyboard can shrink, it would come to rest on the keyboard's edge.
- **The home-indicator gutter is clearance, not decoration.** `--app-bottom-inset` subtracts `--kb-inset` so a footer stops reserving room for a home indicator that the keyboard is already covering; without it the footer carries a dead band while typing.
- The measured keyboard height is persisted to `localStorage`. `focusin` fires _before_ the keyboard reports itself, so the reveal reserves the remembered height up front and the real measurement takes over via `max()`. Without it the first focus of each launch still pans.

## Consequences

- **A footer is not reachable without scrolling while typing.** On `PasteNotesPage` the "Create N cards" CTA is behind the keyboard until you scroll to the end. `MOBILE_DESIGN` §2/§6 previously demanded it stay above the keyboard and were amended — do not "restore" them.
- **`ImportReviewPage`'s "Import N cards" moved from the header to a `FooterBar`**, so both steps of the paste flow present their CTA the same way.
- **`/dev/kitchen-sink` carries a live viewport probe** (`KeyboardProbe`): layout vs visual viewport, the pan, every published variable, and whether `offsetTop + visualViewport.height + --kb-inset` still balances against `--app-height`. It exists because none of this is observable where the code is written, and three fixes were shipped on inference before it did.
- **The probe ships in production builds, on purpose and temporarily.** None of these bugs reproduce outside the installed PWA, which needs HTTPS, which rules out a dev server — so a `import.meta.env.DEV` gate hid the diagnostic from the only environment that shows the fault. Settings → **Developer** therefore links it in every build. **This must be guarded before 1.0 (`NEW_ARCHITECHTURE.md` T11.G)** — gate the section on `useDevMode()`, keep the route reachable but unlisted.
- **`--app-height` can go stale against a genuinely smaller viewport** — it only shrinks on a width change, so a platform that permanently reduces the layout viewport without rotating (browser chrome expanding in a tab) leaves the app hanging below the fold until the next rotation. Accepted: the PWA runs standalone, where that does not happen, and the alternative is trusting a number the keyboard is allowed to move.
- **Only one surface may own a scroll-reveal.** Base UI sheets already scroll their own focused field via `Drawer.VirtualKeyboardProvider`; `useKeyboardReveal` is deliberately opt-in per scroll node rather than a global `focusin` listener, so the two can never fight. It also guards its own re-entrancy: `expectKeyboard` notifies subscribers, and without the guard `focusin` would scroll twice.
