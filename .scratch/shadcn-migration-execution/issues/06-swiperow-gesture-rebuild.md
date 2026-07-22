# 06 — SwipeRow gesture-layer rebuild

Type: task (behavior-sensitive — swipe feel)
Blocked by: 02
Status: resolved

## Question

Execute handoff §3 "Keep-domain, rebuild internals" (cluster 10): keep the `SwipeRow` /
`swipe-actions` domain surface, but move its gesture layer **off raw pointer events onto
`@use-gesture` (`useDrag`)** + the tested `gestures.ts` commit math (zero new dep; retires the inline
`clampOffset`, gives dead `gestures.ts` a consumer).

- Verify swipe-to-action feel is unchanged: arm/commit thresholds, fling velocity, tap-vs-drag
  (`filterTaps`). `gestures.test` covers the commit math it now adopts (handoff §4/§5).
- **Flag for behavior verification.** Verify gate green.

## Answer

Landed. Gate: typecheck clean, lint 0 errors, **540/540** (gestures.test grew 6→8 cases, +2 total).

**gestures.ts generalized + given its consumer.** The dead trailing-only helpers
(`clampSwipeOffset(x, max)` / `shouldCommitSwipe` / `SWIPE_DELETE_*`) are gone (zero consumers —
confirmed). In their place, the *exact* bidirectional math SwipeRow was doing inline, now pure +
tested, keyed off a `SwipeGeometry` (`hasLeading/hasTrailing`, tray widths, commit points):
`clampSwipeOffset(raw, geo)` (rubber-band 0.35 past commit, 0.12 wrong-way), `armedSide(offset, geo)`,
`resolveSwipeRelease(offset, geo)` → commit-leading|commit-trailing|open-*|close. `gestures.test`
rewritten to cover them. Barrel updated. This retires the inline `clampOffset` and the inline finish
logic — SwipeRow is now the consumer.

**SwipeRow event layer → `@use-gesture` `useDrag`.** Raw `onPointerDown/Move/Up/Cancel` + hand-rolled
axis lock + manual velocity gone. Bound via `config.target={dragRef}` (not a `bind()` spread — sidesteps
the `onDrag` type clash with `motion.div`'s own drag props). `axis:'x'` + `touch-action:pan-y` lets
vertical scroll through natively; `filterTaps` handles tap-vs-drag (replaces the old suppress-click
axis math, though `onClickCapture` is kept for the open→tap-to-close case). Same recognizer as
StudyDeck/CardBrowser (handoff §4 line 81). Commit is offset-based exactly as before (SwipeRow never
had fling; not adding it, to hold feel).

**Test infra:** added a jsdom Pointer Capture stub to `shared/test/setup.ts` —
`@use-gesture` calls `setPointerCapture` unguarded (the old code used `?.`), which jsdom lacks; without
the stub, any test that pointer-interacts a swipe row throws (`NotificationsPanel` caught it).

**⚠ On-device behavior verification still owed (per ticket type):** arm/commit thresholds, tap-vs-drag,
and that `pan-y` + `axis:'x'` feel matches the old raw-pointer version on touch. jsdom can't exercise
real gestures. **Unblocks nothing new; de-risks widget swipe rows (07–09).**
