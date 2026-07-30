# Keyboard chrome — one pan, one box, one contract

- **Status:** implemented, **unverified on device** · **Date:** 2026-07-30
- **Outstanding:** the D5 decision gate and the four-cell rect-space matrix both need a real iOS run. Sections marked
  _As built_ record where the implementation diverged from this design and why.
- **Relates to:** [ADR 0002](../../adr/0002-keyboard-covers-the-app.md), [CODE_STYLE §11](../../CODE_STYLE.md)
- **Amends, does not supersede:** ADR 0002 keeps its anchoring decision. This spec fixes how the pan is sampled and
  consumed, and states the contract every page follows.

## Problem

Observed on the installed iOS PWA (standalone), reported per page:

| Symptom                                                             | Where                         |
| ------------------------------------------------------------------- | ----------------------------- |
| The header can be dragged down with a finger while scrolling        | Card editor, keyboard up only |
| The header comes to rest below the top of the screen and stays      | Card editor                   |
| The header covers content that cannot be scrolled out from under it | Surfaces without `.pt-pan`    |
| Almost correct — small, occasional movement                         | Settings → Edit profile       |
| No symptom                                                          | Paste notes (with content)    |

## Root cause

`shared/lib/keyboard-viewport.ts` re-derives the keyboard **height** only when the visual viewport actually resized
(`if (sizeChanged)`, line 137), because iOS slides the visual viewport during a rubber-band and a mid-flight reading is
noise. That same guard was never applied to the **pan**:

```ts
vv.addEventListener('scroll', schedule) //  every scroll frame schedules measure()
// …
publishTop(keyboardHeight() > 0 ? Math.max(top, viewportTop()) : top) // line 153 — no sizeChanged guard
```

So `--vv-top` tracks the rubber-band frame by frame. `theme.css` translates `[data-slot="header-bar"]` and
`[data-slot="status-cap"]` by that value, so the header follows the finger. `Math.max` then holds the deepest sample
until blur, so the header never returns to the top — ADR 0002's max-hold is damping layered over a sampling fault, and
it converts a judder into a permanent misposition.

Severity is inversely proportional to a page's scroll range: a page with range scrolls when you drag, a page without it
rubber-bands, and only a rubber-band moves the visual viewport. That is the whole page-to-page pattern above.

**Verified by falsification, not inference.** Prediction: emptying `PasteNotesPage`'s textarea until the page no longer
scrolls will reproduce the flicker on a page that does not have it. It did. The card editor cannot be tested in the
opposite direction — its fields have fixed heights and `fill` stretches the content to the scrollport, so it can never
earn scroll range from content, which is why it is permanently at a scroll extreme and permanently broken.

## Decisions

### D1 — The pan is sampled per keyboard event, never per frame

**As built, refined from "move `publishTop` inside the `sizeChanged` branch".** A `resize`-only pan is wrong: iOS
re-pans **without resizing** when focus moves between fields, so a scroll-blind pan leaves the chrome compensating for
a stale offset and the header off the screen. Instead `measure()` runs on `resize` only and publishes the pan there
immediately, and the `scroll` listener publishes the pan **only once the viewport has been still for
`PAN_SETTLE_MS`** — a rubber-band never settles at a new value, so it publishes nothing, while a focus-driven re-pan
does. The `Math.max` hold is removed either way: it damped per-frame noise that no longer reaches the variable, and it
is what prevented the pan from decaying when iOS un-pans.

### D2 — Height and pan get separate subscriber sets

`subscribeKeyboard` was fired from both `publish()` and `publishTop()`, so `useKeyboardReveal` re-ran its `scrollTop`
write on every pan change — over the scroll the user is performing. Split into `subscribeKeyboardHeight` and
`subscribePan`.

**As built:** the split is per _event_, not per _variable_. An opening keyboard moves the inset and the pan in the same
frame, and the reveal must run against both — once. So `measure()` publishes both and wakes the height listeners if
**either** moved, while the scroll-settled pan wakes `subscribePan` alone. "The reveal subscribes to height only" would
have been literally true and behaviourally wrong: where the reserve happens to equal the measured keyboard, the inset
never changes and the reveal would never run at all.

### D3 — The coordinate space is detected, not inferred from `display-mode`

`@media (display-mode: standalone)` is a proxy for the causal question — _does this UA re-anchor `position: fixed` to
the visual viewport during the pan?_ Safari answers differently in a tab and standalone with the same engine, which
proves the gate is correlated rather than causal. Chrome iOS is unmeasured entirely: it runs the same WebKit engine but
a different app chrome, and it is not believed to reach `display-mode: standalone` on iOS at all — a claim this spec
does not rely on, because detection makes it moot. The repository contains no observation of any non-Safari browser;
ADR 0002's evidence is a Safari tab and an installed Safari PWA.

Replace it with a runtime discriminator the probe already reads:

```ts
const panBakedIntoRects = Math.abs(htmlRect.top + vv.offsetTop) < 1
```

Publish `--pan-comp`: `0` when the pan is already baked into rect coordinates, the pan otherwise. CSS consumes
`--pan-comp` with no media query. Every UA — Safari tab, Safari standalone, Chrome iOS, Firefox iOS, Android, desktop —
takes one code path and is corrected by measurement.

### D4 — `visibleBottom()` has two formulas, selected by D3

The visible area is `y ∈ [offsetTop, offsetTop + vvHeight]` in layout coordinates and `y ∈ [0, vvHeight]` in visual
coordinates. Therefore:

| rect space                         | visible bottom                         |
| ---------------------------------- | -------------------------------------- |
| visual-relative (pan baked in)     | `--app-height − --kb-inset − --vv-top` |
| layout-relative (pan not baked in) | `--app-height − --kb-inset`            |

Today's single implementation is the first. ADR 0002 documents rects carrying the pan **in a Safari tab**; it never
states the rect space for standalone, which is the environment where the fixed shell demonstrably rides off. If
standalone is layout-relative, the reveal currently over-scrolls every focused field by the full pan.

### D5 — One box absorbs the pan

Compensation is one declaration on one element. Preferred: `#root { top: var(--pan-comp) }`, with the header/status-cap
translate and `.pt-pan` deleted. The shell then moves as a rigid box, header and content cannot desync, and no scroll
surface can forget an opt-in class — which is the standing cause of "header covers content" on `CardFace`,
`QuizSession`, `MatchBoard` and `CardPreviewFace`.

`top` rather than `transform`: a transform on `#root` would make it the containing block for every `position: fixed`
descendant.

**Decision gate.** D1 alone may make the residual movement unobservable, and shifting the shell moves the focused field,
which can re-trigger iOS's own reveal. So D5 lands _after_ D1 is verified on device. If D1 is sufficient, D5 reduces to
its fallback: keep the header translate, and apply `.pt-pan` to every scroll node that lives under a translated header.
Either outcome is acceptable; the gate decides which.

**Status: the fallback is what shipped.** The header translate stays, now driven by `--pan-comp`, and `.pt-pan` reaches
every screen scrollport through `SCREEN_SCROLL` (D9). `#root { top: var(--pan-comp) }` is **not** in the tree and must
not be added before the device check — the gate exists precisely because the preferred form moves the focused field.

### D6 — Scrollport geometry does not depend on footer presence

`AppScreen` currently flips the scroll body between `flex flex-col` + `pb-keyboard` and `pb-safe` depending on whether
a `footer` prop was passed. On the card editor that prop is conditional on deck data (`showNav`), so one page has two
scroll geometries and the reveal band clamps to the dock in one and to `visibleBottom()` in the other.

Unify the scroll body's box: it always gets `flex flex-col`, so the layout mode no longer depends on a data-driven prop.

**As built, narrowed:** the _padding_ is not unified. `pb-safe` is `max(env(safe-area-inset-bottom), var(--kb-inset))`
and `pb-keyboard` is `var(--kb-inset)` alone, and they differ by exactly the safe-area gutter while the keyboard is
closed — which `FooterBar` already carries itself via `--app-bottom-inset`. Forcing `pb-safe` on the docked case adds a
second gutter **below** the sticky dock, lifting it off the bottom of the screen. That is a visible regression on every
footer in the app, traded for a hygiene win, so the split stays and is now commented at the constants. Footer presence
still decides the reveal band's lower bound, which is correct: a dock is a real floor. **No UI moves.**

### D7 — Bottom-anchored `fixed` chrome hides while the keyboard is up

WebKit re-clamps bottom-anchored fixed and sticky boxes to the visual viewport when the keyboard shows. `FooterBar`'s
dock already handles this by going `static` under `[data-keyboard]`. `AppNav` (`widgets/bottom-nav`, `fixed bottom-…`)
does not, so it floats above the keyboard mid-screen. It hides under `[data-keyboard]`.

### D8 — The focus-steal guard is installed by the bars, not by callers

CODE_STYLE §11 requires `onMouseDown={(e) => e.preventDefault()}` on any control tapped while a field is focused;
`keepFieldFocused` exists only in `shared/ui/primitives/drawer.tsx`. Move it to `shared/lib` and have `HeaderBar` and
`FooterBar` install it, so every full-page surface inherits what sheets already have. Separately,
`CardEditorPage.tsx:57` calls `frontRef.current?.focus()` without `preventScroll` — a documented corruption of the
keyboard measurement. It becomes `focus({ preventScroll: true })`.

### D9 — One scroll-surface contract

One place owns what a screen's scrollport is made of. `AppScreen`, `AuthScreen`, `CardFace`, `QuizSession` and
`MatchBoard` build from it; `Sheet` keeps delegating to Base UI's `VirtualKeyboardProvider`, which owns its own reveal.

**As built, two changes from the sketch.** It is a **constant, not a hook** — `SCREEN_SCROLL` in `shared/lib`
(`overflow-y-auto overscroll-contain scrollbar-hide pt-pan`). A hook returning a class string and nothing else is a
worse module than the string; the reveal stays the separately-opted-in `useKeyboardReveal`, because only surfaces that
can hold a text field want it and Base UI must never be fought for one.

**The lint rule is not implemented and should not be as sketched.** Banning bare `overflow-y-auto` in `pages/` and
`widgets/` also condemns inner scrollers that are not screen scrollports at all — `CardPreviewFace`'s preview box,
`TypeWords`' answer box, `Combobox`'s list — and each would need an opt-out comment, which is a worse signal-to-noise
ratio than the rule buys. `CardPreviewFace` is off the adoption list for the same reason: it is a box inside a card,
and `pt-pan` on it would be wrong. The requirement is documented in CODE_STYLE §11 instead. A precise rule (flagging
`overflow-y-auto` only alongside `flex-1`/`h-full`) is possible and was judged too fragile to be worth it.

### D10 — The `--app-bottom-inset` contradiction is settled

ADR 0002 (line 117) says `--app-bottom-inset` must subtract `--kb-inset`; CODE_STYLE §11 says it must never;
`theme.css:67` subtracts; `AppNav.tsx:36` overrides it without subtracting. Under D7 the nav is hidden while the
keyboard is up, so nothing bottom-anchored needs the subtraction: **do not subtract.** ADR 0002's bullet is amended and
`theme.css:67` follows CODE_STYLE.

## Explicitly rejected

- **Moving the card editor's Save button to the footer.** A footer is behind the keyboard while typing (ADR 0002's
  accepted consequence); Save is used mid-typing. `ImportReviewPage`'s header→footer move was for a confirm-once
  screen and does not transfer.
- **Moving `DeckNav`.** The conditional footer was the defect, and D6 fixes it without relocating anything.
- **Restoring "the footer stays above the keyboard"** (MOBILE_DESIGN §2/§6, already amended).
- **Shrinking the shell to the visual viewport.** The design ADR 0002 superseded.
- **Removing `interactive-widget=resizes-visual`.** Load-bearing on Chrome and Firefox; see `index.html`.

## Behaviour contract

| Phase            | Header                                      | Page footer                                 | Bottom nav | Scroll body                 |
| ---------------- | ------------------------------------------- | ------------------------------------------- | ---------- | --------------------------- |
| Keyboard closed  | Pinned at the top, elevation on scroll      | `sticky bottom-0`, rests at flow position   | Visible    | `pb-safe`                   |
| Keyboard opening | Does not move                               | Goes `static`                               | Hidden     | Gains `--kb-inset` of range |
| Keyboard up      | Pinned; compensated once per keyboard event | At the end of the page, behind the keyboard | Hidden     | Reveal owns `scrollTop`     |
| Keyboard closing | Does not move                               | Returns to `sticky`                         | Visible    | Range released              |

The focused field is revealed by its own scroll body, between the header's bottom and the smaller of the footer's top
and `visibleBottom()`. Nothing else writes `scrollTop`.

## Verification

1. **Probe overlay.** `KeyboardProbe` becomes a movable overlay toggled from Settings → Developer, so any route can be
   instrumented — the current `/dev/kitchen-sink`-only placement is why this took device screenshots to catch. Adds a
   trace timeline (`vv.offsetTop`, `vv.height`, `--vv-top`, `--kb-inset`, `scrollTop`, `html`/`#root`/header/focused
   rects) with a copy button.
2. **Unit tests.** `publishTop` fires on `resize` and not on `scroll`; no max-hold; the reveal does not run on a pan;
   both `visibleBottom` formulas; `panBakedIntoRects` on both spaces.
3. **Device matrix**, keyboard up, one reading each: Safari standalone · Safari tab · Chrome iOS · Android Chrome —
   recording `html rect top`, `#root rect top`, whether fixed rides off, and whether `offsetTop + vv.height +
--kb-inset` balances against `--app-height`. Fills the gap that made D3 necessary.
4. **Manual, on device:** card editor and paste-notes, keyboard up, drag at both scroll extremes. The header must not
   move.

## Risks

- **D5 re-triggers iOS's reveal.** Shifting the shell returns the focused field toward the position iOS judged
  occluded. Mitigated by the decision gate: D5 only ships if D1 proves insufficient, and its fallback keeps ADR 0002's
  shape.
- **D3 misreads a UA.** A browser where `htmlRect.top` is neither `0` nor `−offsetTop` would fall into the "not baked"
  branch. Acceptable: that is the compensating branch, and it is what standalone needs.
- **`--app-height` staleness** is unchanged and still accepted (ADR 0002).
