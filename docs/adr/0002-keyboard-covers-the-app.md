# ADR 0002 — The shell is anchored to the screen; the keyboard covers it

- **Status:** accepted · **Date:** 2026-07-27
- **Supersedes:** the shrink-to-fit viewport design (`#root` sized to `--vvh` and re-anchored to `--vv-top`)

## Context

`#root` was `position: fixed; inset: var(--vv-top) 0 auto 0; height: var(--vvh)` — the whole app shrank to the _visual_ viewport and re-anchored to it on every viewport event. It fitted the keyboard exactly, which meant a `FooterBar` (the last `shrink-0` child of `AppScreen`'s column) always came to rest on the keyboard's top edge.

That produced three faults on device, all from the same source:

1. **The footer rode up with the keyboard.** Unavoidable: it is the bottom of a shell whose bottom _is_ the keyboard.
2. **The page dropped and snapped back** when focus moved to a field near the keyboard. iOS reveals an occluded field by panning the visual viewport (`visualViewport.offsetTop` > 0). We reacted by moving and resizing `#root` to match — which revealed the field a second time, so iOS un-panned, so we moved back. A geometry feedback loop, one full cycle per focus. **The loop is entered by anything that re-lays-out content in response to the pan** — the pan itself is not the fault.
3. **Focusing the fourth field just opened the keyboard.** Nothing in the app ever scrolled a focused field into view. `AppScreen` published no `scroll-padding`, and with `html`/`body` at `overflow: hidden` the document cannot scroll, so the only mechanism that ever revealed anything was the iOS pan from (2).

A first fix — `#root { inset: 0 }`, full layout viewport — moved the faults rather than removing them, because of the fact underneath all of this:

**In a standalone iOS PWA the _layout_ viewport shrinks when the keyboard opens.** Not just the visual one. So `inset: 0` shrank too, and `--kb-inset`, measured as `documentElement.clientHeight - visualViewport.height`, came out ≈ 0 — the keyboard measured as _absent_. From that one stale denominator: no padding, so no scroll range; no reveal, so iOS panned to reveal the field itself and took the header off the top; nothing written to storage, so nothing learned for next time; and a shell that reflowed on every keyboard, which is the flicker. A footer pinned to that scrollport then came to rest on the keyboard's top edge — the exact symptom the whole ADR set out to remove.

**`AuthScreen` was the one surface that never broke, and it is the reference:** no pinned chrome at all, everything in the scroll flow, `pb-safe` turning the inset into scroll range.

## Decision

**The app is anchored to the screen, not to the viewport. The keyboard covers its bottom. The scroll body — not the shell, and not iOS — is what reveals the focused field.**

- **`--app-height` is the layout viewport measured while no field is focused, and held there.** `#root` is `position: fixed; top: 0; height: var(--app-height)`. It re-anchors on a width change (rotation) and when the viewport grows, never while `expectKeyboard(true)` is in force. So the shell keeps its box across a keyboard: nothing reflows, and its bottom edge stays the real screen bottom, behind the keyboard.
- **Every keyboard measurement uses `--app-height` as the denominator**, never live `clientHeight`. `--vvh` and `--vv-top` are both deleted; no shell or chrome reads `visualViewport.offsetTop`. A correct measurement is what stops the pan at source — iOS only pans when _we_ failed to reveal the field.
- `useKeyboardInset` publishes exactly one number, `--kb-inset`, thresholded at 120px so an accessory bar alone never reads as a keyboard. It is the single `visualViewport` subscriber; `useVirtualKeyboard` reads the same measurement instead of taking a second subscription.
- `useKeyboardReveal` (`shared/lib`) attaches to a scroll node, and on `focusin` of a text field sets `node.scrollTop` so the field clears the keyboard by `REVEAL_GAP`, re-running whenever `--kb-inset` changes. `AppScreen` wires it through its existing scroll ref; `AuthScreen` and `CardFace` opt in.
- Scroll bodies carry `padding-bottom: var(--kb-inset)` while the keyboard is up (`.pb-keyboard`, and `.pb-safe` via `max()`). **The padding is not decoration — it is the scroll range** the reveal needs to lift the last field. `scroll-padding-bottom` alone creates none.
- **A page footer sits in the scroll flow (`mt-auto`), never pinned** (`AppScreen`'s `FOOTER_DOCK`) — the `AuthScreen` shape. While the content fits it rests at the bottom; once it doesn't, it is reached by scrolling to the end, and with the keyboard up the `--kb-inset` padding is the range that lifts it clear. **No `sticky`, no `fixed`:** bottom-pinned chrome anchors to the scrollport, and a scrollport is exactly the thing a keyboard is entitled to shrink.
- The measured keyboard height is persisted to `localStorage`. `focusin` fires _before_ the keyboard reports itself, so the reveal reserves the remembered height up front and the real measurement takes over via `max()`. Without it the first focus of each launch still pans.

## Consequences

- **A footer is not reachable without scrolling while typing.** On `PasteNotesPage` the "Create N cards" CTA is behind the keyboard until you scroll to the end. `MOBILE_DESIGN` §2/§6 previously demanded it stay above the keyboard and were amended — do not "restore" them.
- **Bottom insets stop subtracting `--kb-inset`.** `--app-bottom-inset`, `.pb-safe` and `.pb-gutter` were compensating for a shell that shrank; under a shell that doesn't, the subtraction is just a twitch on keyboard open.
- **`--app-height` can go stale against a genuinely smaller viewport** — it only shrinks on a width change, so a platform that permanently reduces the layout viewport without rotating (browser chrome expanding in a tab) leaves the app hanging below the fold until the next rotation. Accepted: the PWA runs standalone, where that does not happen, and the alternative is trusting a number the keyboard is allowed to move.
- **Only one surface may own a scroll-reveal.** Base UI sheets already scroll their own focused field via `Drawer.VirtualKeyboardProvider`; `useKeyboardReveal` is deliberately opt-in per scroll node rather than a global `focusin` listener, so the two can never fight. It also guards its own re-entrancy: `expectKeyboard` notifies subscribers, and without the guard `focusin` would scroll twice.
