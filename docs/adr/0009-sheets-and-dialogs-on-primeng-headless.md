# ADR-0009: Sheets and dialogs move to PrimeNG headless overlays

**Status:** Accepted
**Date:** 2026-07-16
**Supersedes in part:** ADR-0002 (rows 1–2 of the widget ownership matrix, and its overlay stacking contract)

## Context

ADR-0002 gave bottom sheets to `MatBottomSheet` and dialogs to `MatDialog`. In practice the app never used the chrome either one ships: `ms-sheet-shell` hand-draws the grab handle, title, close button and footer, and `ms-confirm-dialog` draws its own icon, copy and buttons. Material contributed the overlay mechanics and a theme we then had to override token by token to reach the app's look (ADR-0001).

PrimeNG v21 exposes a real headless mode — `<ng-template #headless>` on `Drawer` and `Dialog` — that replaces the component's inner markup while keeping the parts that are genuinely hard: scrim, focus trap, Escape handling, scroll block, motion and z-index. Since the app supplies all sheet chrome anyway, headless removes the theme fight without giving up the mechanics.

## Decision

**Bottom sheets are a headless `p-drawer` with `position="bottom"`; dialogs are a headless `p-dialog`.** Both are reached through a thin service pair in `shared/ui/`:

- `sheet.ts` — `SHEET_DATA`, `SheetRef<R>`, `SheetService.open(Component, { data })`
- `dialog.ts` — `DIALOG_DATA`, `DialogRef<R>`, `DialogService.open(Component, { data })`

Each `open()` returns a ref whose `closed` promise carries the dismissal result, so a sheet's public API stays a promise-returning `open*()` function co-located with the sheet (ADR-0008) — `openMoveDeckSheet`, `openFolderSheet` and `openCardFilterSheet` kept their signatures through the migration.

## Why a hand-written bridge, given `DialogService` exists

PrimeNG _does_ ship an imperative overlay with a result: `DialogService.open()` (dynamicdialog) returns a `DynamicDialogRef` with `close(result)` and `onClose` — a direct analogue of `MatBottomSheetRef.afterDismissed()`. It is not usable here, because **imperative-with-result and headless don't come in the same box**: `DynamicDialogConfig.templates` exposes only header/content/footer/icons and renders content through `ngComponentOutlet` inside a standard `p-dialog` shell. There is no headless slot. Getting both meant ~80 lines of shared bridge, written once.

## The two constraints the bridge is shaped around

1. **`Drawer` has no "leave finished" output.** `onHide` fires when a dismiss is _requested_, and the internal `onAfterLeave` deliberately emits nothing — so a programmatic close never reports completion at all.
2. **The motion hook cannot be borrowed.** The motion directive resolves `onAfterLeave: options.onAfterLeave ?? handleAfterLeave`, so passing a hook through `motionOptions` **replaces** the component's own cleanup (z-index release, listener unbind) rather than running beside it.

3. **A dismissal must go through the component's own `close()`, never a bare `visible = false`.** Only `close()` reaches `disableModality()`, and that scrim leave-animation's `animationend` is the sole thing that removes the scrim and unblocks body scroll. `Drawer.onDestroy()` does not cover for it — it guards cleanup with `if (this.visible && this.modal)`, already false by then. Clearing `visible` directly therefore stranded a scrim over a page that could no longer scroll, on **every sheet that returns a result**. The scrim-tap path happened to work, which is exactly why it would have shipped unnoticed. `sheet.spec.ts` locks both paths down; the host also clears any surviving mask defensively before it goes.

The bridge therefore pins the motion duration (`motionOptions.duration`, honoured as a deterministic timer) and settles its promise on the same constant. `Drawer` ships a 0.5s animation, so `.ms-sheet` overrides `animation-duration` to match `SHEET_MOTION_MS`; `Dialog` is already 300ms and needs no override. **Changing either constant means changing the paired CSS**, which is why both carry a comment saying so. Under `prefers-reduced-motion` the motion is skipped and the constant drops to 0.

## Consequences

- **One overlay stack.** Every overlay is PrimeNG's, ordered by `zIndex` in `app.config.ts` (overlay/menu 1200 < modal 1300 < tooltip 1400). ADR-0002's CDK-vs-PrimeNG stacking contract is obsolete; nothing renders on CDK's overlay stack now.
- **Material's remaining surface is buttons and form inputs.** It is no longer load-bearing for overlays. `@angular/cdk` stays for drag-drop only.
- **A duration constant is coupled to a CSS rule** — the one genuine wart, accepted because the alternative (breaking Drawer's cleanup) is worse.
- Initial bundle got ~3 kB smaller; PrimeNG's overlays cost less here than Material's did.
- The `ms-sheet-panel` / `ms-dialog-panel` Material panel classes are gone.
