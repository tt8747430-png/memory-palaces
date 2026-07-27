# ADR 0002 — The keyboard covers the app; shells never resize for it

- **Status:** accepted · **Date:** 2026-07-27
- **Supersedes:** the shrink-to-fit viewport design (`#root` sized to `--vvh` and re-anchored to `--vv-top`)

## Context

`#root` was `position: fixed; inset: var(--vv-top) 0 auto 0; height: var(--vvh)` — the whole app shrank to the _visual_ viewport and re-anchored to it on every viewport event. It fitted the keyboard exactly, which meant a `FooterBar` (the last `shrink-0` child of `AppScreen`'s column) always came to rest on the keyboard's top edge.

That produced three faults on device, all from the same source:

1. **The footer rode up with the keyboard.** Unavoidable: it is the bottom of a shell whose bottom _is_ the keyboard.
2. **The page dropped and snapped back** when focus moved to a field near the keyboard. iOS reveals an occluded field by panning the visual viewport (`visualViewport.offsetTop` > 0). We reacted by moving and resizing `#root` to match — which revealed the field a second time, so iOS un-panned, so we moved back. A geometry feedback loop, one full cycle per focus. **The loop is entered by anything that re-lays-out content in response to the pan** — the pan itself is not the fault.
3. **Focusing the fourth field just opened the keyboard.** Nothing in the app ever scrolled a focused field into view. `AppScreen` published no `scroll-padding`, and with `html`/`body` at `overflow: hidden` the document cannot scroll, so the only mechanism that ever revealed anything was the iOS pan from (2).

The common root is that **an occluded field forces a pan**, and a shell that tracks the pan is a shell that moves twice.

## Decision

**The app is always the full layout viewport. The keyboard covers its bottom. The scroll body — not the shell, and not iOS — is what reveals the focused field.**

- `#root` is `position: fixed; inset: 0`. **No shell reads `visualViewport.offsetTop`** — `--vvh` is deleted.
- **`--vv-top` survives, but only chrome that must never leave the screen may consume it.** A pan is still possible (iOS reveals a field before `focusin` reaches us, and does not un-pan until blur), and a fixed root panned by 113px is a header 113px off the top. `HeaderBar` — the one header chrome, so this covers every screen — takes `translate-y-[var(--vv-top)]`, as does `RootLayout`'s status cap. **`transform`, deliberately: it moves no field, so iOS's reveal decision cannot change and the loop cannot restart.** Anything that would _re-layout_ content by the pan offset is the old design and brings the flicker back.
- `useKeyboardInset` publishes exactly one number, `--kb-inset`, thresholded at 120px so an accessory bar alone never reads as a keyboard. It is the single `visualViewport` subscriber; `useVirtualKeyboard` reads the same measurement instead of taking a second subscription.
- `useKeyboardReveal` (`shared/lib`) attaches to a scroll node, and on `focusin` of a text field sets `node.scrollTop` so the field clears the keyboard by `REVEAL_GAP`, re-running whenever `--kb-inset` changes. `AppScreen` wires it through its existing scroll ref; `AuthScreen` and `CardFace` opt in.
- Scroll bodies carry `padding-bottom: var(--kb-inset)` while the keyboard is up (`.pb-keyboard`, and `.pb-safe` via `max()`). **The padding is not decoration — it is the scroll range** the reveal needs to lift the last field. `scroll-padding-bottom` alone creates none.
- **A page footer is `sticky bottom-0` inside the scroll body, not a sibling below it** (`AppScreen`'s `FOOTER_DOCK`). Keyboard down, `--kb-inset` is `0`, the footer's flow position is the scrollport bottom and it is pinned there exactly as a docked bar. Keyboard up, the same `--kb-inset` padding becomes scroll range _below_ the footer, so scrolling to the end lifts it out from behind the keyboard. One rule, no branch, no remount, no reflow when the keyboard opens — the sticky footer earns the keyboard padding the same way the glass header earns its scroll.
- The measured keyboard height is persisted to `localStorage`. `focusin` fires _before_ the keyboard reports itself, so the reveal reserves the remembered height up front and the real measurement takes over via `max()`. Without it the first focus of each launch still pans.

## Consequences

- **A footer is not reachable without scrolling while typing.** On `PasteNotesPage` the "Create N cards" CTA is behind the keyboard until you scroll to the end. `MOBILE_DESIGN` §2/§6 previously demanded it stay above the keyboard and were amended — do not "restore" them.
- **Bottom insets stop subtracting `--kb-inset`.** `--app-bottom-inset`, `.pb-safe` and `.pb-gutter` were compensating for a shell that shrank; under a shell that doesn't, the subtraction is just a twitch on keyboard open.
- **The reveal band stops at the footer, not at the keyboard.** A sticky footer sits inside the scrollport, so `useKeyboardReveal` clamps to `[data-slot="footer-bar"]`'s top as well as the keyboard's — otherwise a field revealed "above the keyboard" lands behind the footer once the end of the scroll lifts it.
- **Only one surface may own a scroll-reveal.** Base UI sheets already scroll their own focused field via `Drawer.VirtualKeyboardProvider`; `useKeyboardReveal` is deliberately opt-in per scroll node rather than a global `focusin` listener, so the two can never fight. It also guards its own re-entrancy: `expectKeyboard` notifies subscribers, and without the guard `focusin` would scroll twice.
