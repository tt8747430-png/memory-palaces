# ADR 0002 — The keyboard covers the app; shells never resize for it

- **Status:** accepted · **Date:** 2026-07-27
- **Supersedes:** the shrink-to-fit viewport design (`#root` sized to `--vvh` and re-anchored to `--vv-top`)

## Context

`#root` was `position: fixed; inset: var(--vv-top) 0 auto 0; height: var(--vvh)` — the whole app shrank to the _visual_ viewport and re-anchored to it on every viewport event. It fitted the keyboard exactly, which meant a `FooterBar` (the last `shrink-0` child of `AppScreen`'s column) always came to rest on the keyboard's top edge.

That produced three faults on device, all from the same source:

1. **The footer rode up with the keyboard.** Unavoidable: it is the bottom of a shell whose bottom _is_ the keyboard.
2. **The page dropped and snapped back** when focus moved to a field near the keyboard. iOS reveals an occluded field by panning the visual viewport (`visualViewport.offsetTop` > 0). We reacted by moving and resizing `#root` to match — which revealed the field a second time, so iOS un-panned, so we moved back. A geometry feedback loop, one full cycle per focus.
3. **Focusing the fourth field just opened the keyboard.** Nothing in the app ever scrolled a focused field into view. `AppScreen` published no `scroll-padding`, and with `html`/`body` at `overflow: hidden` the document cannot scroll, so the only mechanism that ever revealed anything was the iOS pan from (2).

The common root is that **an occluded field forces a pan**, and a shell that tracks the pan is a shell that moves twice.

## Decision

**The app is always the full layout viewport. The keyboard covers its bottom. The scroll body — not the shell, and not iOS — is what reveals the focused field.**

- `#root` is `position: fixed; inset: 0`. Nothing in the app reads `visualViewport.offsetTop`; `--vvh` and `--vv-top` are deleted.
- `useKeyboardInset` publishes exactly one number, `--kb-inset`, thresholded at 120px so an accessory bar alone never reads as a keyboard. It is the single `visualViewport` subscriber; `useVirtualKeyboard` reads the same measurement instead of taking a second subscription.
- `useKeyboardReveal` (`shared/lib`) attaches to a scroll node, and on `focusin` of a text field sets `node.scrollTop` so the field clears the keyboard by `REVEAL_GAP`, re-running whenever `--kb-inset` changes. `AppScreen` wires it through its existing scroll ref; `AuthScreen` and `CardFace` opt in.
- Scroll bodies carry `padding-bottom: var(--kb-inset)` while the keyboard is up (`.pb-keyboard`, and `.pb-safe` via `max()`). **The padding is not decoration — it is the scroll range** the reveal needs to lift the last field. `scroll-padding-bottom` alone creates none.
- The measured keyboard height is persisted to `localStorage`. `focusin` fires _before_ the keyboard reports itself, so the reveal reserves the remembered height up front and the real measurement takes over via `max()`. Without it the first focus of each launch still pans.

## Consequences

- **A footer is not reachable while typing.** On `PasteNotesPage` that is the "Create N cards" CTA; it returns when the keyboard is dismissed. Accepted deliberately, in exchange for chrome that never moves. `MOBILE_DESIGN` §2/§6 previously said the opposite and were amended — do not "restore" them.
- **Bottom insets stop subtracting `--kb-inset`.** `--app-bottom-inset`, `.pb-safe` and `.pb-gutter` were compensating for a shell that shrank; under a shell that doesn't, the subtraction is just a twitch on keyboard open.
- **The reveal clears the keyboard by an extra footer-height** on footer pages, since `--kb-inset` is measured from the screen bottom while the scrollport ends above the footer. Kept — the field lands a notch above the keyboard instead of flush against it.
- **Only one surface may own a scroll-reveal.** Base UI sheets already scroll their own focused field via `Drawer.VirtualKeyboardProvider`; `useKeyboardReveal` is deliberately opt-in per scroll node rather than a global `focusin` listener, so the two can never fight.
- A pan is still possible where no scroll node can absorb it (a field with no scrollable ancestor). The app no longer follows it, so the header rides off-screen for the duration instead of oscillating.
