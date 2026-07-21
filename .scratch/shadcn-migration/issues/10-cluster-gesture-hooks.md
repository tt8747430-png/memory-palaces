# Cluster: Gesture hooks & touch surfaces (decides @use-gesture)

Type: grilling
Status: resolved
Blocked by: 02

## Question

**No default verdict** — each decided cold (keep / delete / rebuild-as-wrapper). These are
the "added functionality" the original ask names; `docs/MOBILE_DESIGN.md` + `docs/CODE_STYLE.md`
§10 currently treat them as load-bearing, and shadcn/Base UI provides no equivalent. Decide
each on its own merits and record the reasoning:

- `use-long-press` (`use-long-press.test`) — long-press to enter select mode.
- `gestures` (`gestures.test`) + `@use-gesture` dep — the swipe/drag primitives.
- `SwipeRow` (329 lines) + `swipe-actions.tsx` — swipe-to-action rows. Largest surface.
- `use-drag-to-dismiss` (`shared/ui`) — sheet dismiss physics (coordinate with `vaul`
  decision in Overlays 07).
- `haptics` (`haptics.test`), `shake`, `speech` — feedback/utility behaviors.
- Direct `@use-gesture` consumers: `widgets/study-session/StudyDeck`,
  `widgets/content-editor/CardBrowser`.

Explicit output per item: verdict + whether `@use-gesture` stays. If any is deleted, note
the `docs/MOBILE_DESIGN.md` / §10 edits required (the docs are the source of truth this must
stay consistent with).

## Answer

**Correction (Base UI now ships a gesture `Drawer`).** `@use-gesture` is **not** "no equivalent," and
the inventory was partly wrong — corrected below.

- **Inventory fix:** `@use-gesture` is *currently* used by only two files —
  `widgets/study-session/StudyDeck` and `widgets/content-editor/CardBrowser` (both `useDrag`).
  `SwipeRow` today is built on `motion` + **raw pointer events** (`useMotionValue`/`animate` +
  `onPointerDown/Move/Up`) with a hand-rolled axis-lock/fling — see the `SwipeRow` verdict below,
  which now consolidates it onto `@use-gesture` too.
- `use-drag-to-dismiss` → **DELETE.** It backed only `ActionSheet`, which now rebuilds on the Base UI
  `Drawer` (07) — the Drawer's **native swipe** replaces this motion hook.
- `@use-gesture` → **KEEP (out-of-scope-additive).** (Corrects an earlier "lean drop.") It's a
  gesture *recognizer* — normalized `movement`/`velocity`/`direction`, axis-lock, and `filterTaps`
  (tap-vs-drag) — which `motion` (an *animator*) does not replace; they compose. Base UI Drawer's
  swipe replaces only *drawer dismissal*, **not** `StudyDeck`'s 2-axis card throw (`filterTaps` +
  velocity + `event.target` scroller/control detection + long-press) or `CardBrowser`'s axis-locked
  pager (`filterTaps` + velocity + direction). Hand-rolling that is exactly the bespoke code the
  migration exists to remove — so it stays, alongside `@dnd-kit`/`motion`/`sonner`.
- `use-long-press` → **keep** — pure pointer long-press (no dep), no equivalent. `use-long-press.test`
  intact.
- `gestures` → **keep** — pure swipe math (`clampSwipeOffset`/`shouldCommitSwipe`; does **not**
  import `@use-gesture`), unit-tested. *(Correction: it is currently only barrel-exported with **no
  consumer** — `SwipeRow` has its own inline `clampOffset`. The `SwipeRow` rebuild below adopts these
  functions, giving `gestures.ts` a real consumer.)* `gestures.test` intact.
- `SwipeRow` (329 ln) + `swipe-actions` → **keep (domain), but rebuild its gesture layer on
  `@use-gesture`.** _(Reconciliation requested — consistency with the `@use-gesture` KEEP above.)_
  SwipeRow hand-rolls exactly what `@use-gesture` provides (axis-lock at `SwipeRow.tsx:147–158`,
  fling/velocity thresholds, pointer capture, tap-vs-drag). Since the dep is kept anyway, move
  **recognition** to `useDrag` (`{ axis:'x', filterTaps:true, pointer:{touch:true} }`) feeding a
  `motion` `useMotionValue` for the animation (motion still owns the spring/animate); and move the
  **commit-threshold math** to the already-tested `gestures.ts` (`clampSwipeOffset`/
  `shouldCommitSwipe`) instead of the inline `clampOffset`. Net: **zero new dep**, less bespoke
  pointer code, and dead `gestures.ts` gets used. Keep the domain surface (tray, accents, haptics)
  and the `-mx-5` bleed. Verify no regression to the swipe-to-action feel; `swipe-actions` unchanged.
- `haptics`, `shake`, `speech` → **keep** — feedback/utility, no shadcn overlap.

**Doc edits:** deleting `use-drag-to-dismiss` requires a `docs/MOBILE_DESIGN.md` / `CODE_STYLE.md`
§10 note that sheet-dismiss physics now come from Base UI `Drawer` native swipe. `@use-gesture`
stays, so no doc change there. Flagged for handoff (16).
