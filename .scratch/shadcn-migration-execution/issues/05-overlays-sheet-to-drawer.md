# 05 — Overlays: Sheet family → Base UI Drawer

Type: task (behavior-sensitive — iOS verification)
Blocked by: 03
Status: resolved

## Question

Execute handoff §3 overlays (cluster 07):

- Rebuild `Sheet` / `PromptSheet` / `ActionSheet` on **Base UI `Drawer`** (native swipe + snap +
  `VirtualKeyboardProvider`).
- **Delete `use-drag-to-dismiss`** (`shared/ui/use-drag-to-dismiss.ts`) — replaced by Drawer native
  swipe (10). Remove its barrel export + any imports.
- iOS: `Drawer.VirtualKeyboardProvider` must preserve the keyboard behavior `vaul`'s
  `repositionInputs` gave (handoff §4 risk) — **flag for on-device iOS verification**.

⚠ Do **not** remove `vaul` from `package.json` yet — that happens in ticket 11 after all Sheet call
sites (widgets 07/08) are off it. Verify gate green.

## Answer

Landed. All three overlays on the ticket-03 Base UI `Drawer` foundation (deep import
`./primitives/drawer`); `use-drag-to-dismiss.ts` deleted (no barrel export, only ActionSheet used it).
Gate: typecheck clean, lint 0 errors, **538/538**. `vaul` still in `package.json` per the ⚠ (removed
in 11).

- **Sheet** → `Drawer` + `DrawerContent` (Portal/Backdrop/Viewport/Popup/Content) + handle/header/
  footer. Same `SheetProps`, plus a new optional `initialFocus` passthrough to the popup.
- **ActionSheet** → `Drawer`; the `OPEN_GUARD_MS` outside-press/focus-out guard ported verbatim
  (Base UI `REASONS` values are the same kebab `'outside-press'`/`'focus-out'` the old Dialog used).
- **PromptSheet** → unchanged structurally (composes Sheet) except it now passes `initialFocus={inputRef}`
  so the caret lands in the field: Base UI moves focus to the first tabbable (the close ✕) on open,
  which would otherwise skip the input; `autoFocus` dropped in favour of `initialFocus` + `useAutoSelect`.

**Bug found & fixed mid-ticket:** `DrawerVirtualKeyboardProvider` calls `useDialogRootContext` and
reads the Viewport from the drawer store, so it must sit **inside** `Drawer.Root` wrapping
`DrawerContent` — my first pass wrapped it *outside* Root and every sheet-rendering widget threw
(`Cannot destructure 'store' of undefined`). Corrected; suite green.

**⚠ On-device iOS verification still required (per ticket type):**
1. `VirtualKeyboardProvider` must reproduce vaul `repositionInputs` — the sheet lifting above the
   keyboard (PromptSheet / InStudyEditor / content sheets). jsdom can't exercise `visualViewport`.
2. Base UI swipe-to-dismiss acts on the whole popup (no vaul `handleOnly`). Confirm it doesn't hijack
   inner interactive/scroll surfaces — DeckAppearanceSheet colour scroller, DeckContentEditor DnD,
   SwipeRow rows. If it does, constrain dismissal to the grab handle.

**Unblocks nothing new directly** (widgets 07–10 already free); it *de-risks* the sheet call sites they
touch. `vaul` removal deferred to 11.
