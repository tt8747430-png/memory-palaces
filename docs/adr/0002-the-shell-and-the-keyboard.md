# ADR 0002 — The shell is anchored to the screen; the keyboard covers it

- **Status:** accepted · **Date:** 2026-07 · consolidated 2026-10

The operational rules are [CODE_STYLE §11](../CODE_STYLE.md). The implementation is
`shared/lib/keyboard-viewport.ts`, which carries the reasoning per branch, and `shared/ui/AppScreen.tsx`.

## Context

What iOS does, measured on device (iOS 26, standalone), because two rounds of fixes were lost to guessing:

- The layout viewport does not resize when the keyboard opens; only the visual viewport shrinks (shell `793`
  before and during, `visualViewport.height` `390`, `offsetTop` `289`).
- Safari pans the visual viewport to reveal the focused field and holds the pan until blur, but only when the page
  has not revealed the field itself.
- `visualViewport.offsetTop` and `getBoundingClientRect()` are different coordinate spaces. Mixing them counts the
  pan twice.
- `interactive-widget` is unimplemented in WebKit ([#259770](https://bugs.webkit.org/show_bug.cgi?id=259770)). The
  meta in `index.html` still says `resizes-visual` on purpose: Chrome 108+ and Firefox 132+ honour it, and
  `resizes-content` would shrink the layout viewport with the visual one and collapse every keyboard number to ~0.
- Pinch-zoom looks like a keyboard by geometry; `scale` is the only tell. An installed app locks zoom; a tab can't.

## Decision

**The app is anchored to the screen, the keyboard covers its bottom, and the scroll body reveals the focused field.**

- `--app-height` is the layout viewport sampled while nothing is focused, and held. `#root` is `position: fixed;
top: 0; height: var(--app-height)`, re-anchored only on a width change or growth. Every keyboard number derives
  from it.
- **Nothing compensates for the pan; the pan is prevented.** The scroll body gets range enough to lift its last
  field clear of the keyboard: `--kb-range` = `--kb-inset + REVEAL_GAP`, published by the module that aims the
  reveal so the two can't drift. Short of that range iOS finishes the reveal itself, by panning.
- "Is a keyboard up" and "how much does it cover" are two numbers. The keyboard's height is `--app-height −
visualViewport.height`; the 120px floor that tells a keyboard from an accessory bar applies to it. `--kb-inset` is
  the height minus the pan.
- `visibleBottom()` is the only bridge between the two coordinate spaces. Everything else compares rect to rect.
- It listens to `resize` and `orientationchange`, never `scroll`: nothing should be positioned from the pan.
- **Bottom chrome yields to the keyboard.** WebKit re-clamps bottom-anchored fixed boxes to the visual viewport, so
  nothing bottom-pinned rides the keyboard:
  - A page's footer has two positions (`AppScreen`, `useKeyboardOpen()`): with no keyboard it is a flex sibling
    below the scroll body, immovable; with the keyboard up it is the last thing inside the scroll body, reached by
    scrolling. No `sticky`, no `fixed`, no measured spacer.
  - There is one `BottomDock`, mounted by `AppNav`. Its pill never fades; a page borrows it through `BottomSlot` (a
    portal into the dock's content layer) and only the contents cross-fade. It hides under `data-keyboard`.
- **Only one surface owns a scroll-reveal.** Base UI sheets scroll their own fields, so `useKeyboardReveal` is opt-in
  per scroll node, never a global `focusin` listener.

## Consequences

- **The acceptance test: the header does not move when the keyboard opens.** If it moves, ask why the reveal did not
  clear the field, never what should compensate.
- A footer is not reachable without scrolling while typing. An action that must survive typing goes in the header.
- `--app-height` can go stale against a really smaller layout viewport, since it only shrinks on a width change.
  Accepted: standalone doesn't do that.
- **The developer surface ships in every build until 1.0.** None of this reproduces outside the installed PWA, which
  needs HTTPS, so a `import.meta.env.DEV` gate would hide the one diagnostic that shows the bug. `/dev/kitchen-sink`
  (`ROUTES.devKitchenSink`) carries a live viewport probe that judges each reading and keeps keyboards as
  `{ before, after }` pairs; Settings → Developer links to it and holds the dev-mode and probe-overlay switches.
  Both render for everyone today. Before 1.0: wrap the Developer section in `selectDevMode`, give dev mode an
  unadvertised way in, and leave the route reachable but unlisted. Guard it; don't delete it.

## History

- Shrink-to-fit: `#root` sized to `--vvh` and re-anchored to `--vv-top`, so a footer rested on the keyboard (2026-07).
- Four rounds of pan compensation: a `display-mode` gate, a measured boolean, a hidden probe, `--vv-top` /
  `--pan-comp` / `--pan-pad` / `.pt-pan` (2026-07). Deleted; the pan is prevented instead.
- The 120px keyboard floor on the inset rather than the height (2026-07).
- A `sticky` footer inside the scroll body with a `static` override under the keyboard (2026-09). It lifted at the end
  of a scroll and was re-laid out on first paint; replaced by the two positions.
- Two docks cross-fading, the nav and the select toolbar, with a refcounted inset (2026-09). The bar dipped to
  see-through mid-fade; replaced by one dock.
