# Cluster: Overlays, sheets & menus (decides vaul)

Type: grilling
Status: resolved
Blocked by: 02

## Question

Per-member verdict + shadcn mapping, and the **`vaul` decision**:

- `Sheet` (78 lines, on `vaul`, `use-drag-to-dismiss`) → shadcn `Sheet`/`Drawer`. **Does
  Base UI's Dialog/shadcn Drawer replace `vaul`?** Weigh the drag-to-dismiss physics `vaul`
  gives against Base UI. If `vaul` stays, note why (coordinate the `use-drag-to-dismiss`
  verdict with Gesture-hooks 10).
- `PromptSheet` → composition over the Sheet decision.
- `ActionSheet` (already on `@base-ui/react`) → shadcn `Sheet` + action list, or keep.
- `ConfirmDialog` (already on `@base-ui/react`) → shadcn `AlertDialog`; keep as thin
  domain wrapper (repeated confirm pattern — wrapper earned).
- `FlyoutMenu` (already on `@base-ui/react`) → shadcn `DropdownMenu`/`Popover`; used by
  `OverflowMenuButton` (04) and `SortControl` (06) — settle the shared trigger here. Note
  `FlyoutMenu.test`.

Adopt compound idioms (`<Dialog><DialogTrigger/><DialogContent/>`) at call sites. Honor
`docs/MOBILE_DESIGN.md` (sheets/menus/overlays, safe areas) and `prefers-reduced-motion`.

## Answer

**Correction — `vaul` decision: DROP `vaul`.** (An earlier pass wrongly assumed shadcn's Drawer *is*
vaul; verified false.) The Base-UI-flavour `Drawer` is built on **`@base-ui/react/drawer`**
([`base-drawer.tsx`](../assets/base-drawer.tsx)) — a native primitive with **swipe-to-dismiss**,
**snap points**, `swipeDirection`, and **`Drawer.VirtualKeyboardProvider`** (Base UI's keyboard-aware
focus/scroll for software keyboards — the direct replacement for vaul's `repositionInputs`, which was
our *entire* reason for vaul). It also handles safe-area + iOS `position:fixed` via
`supports-[-webkit-touch-callout]` branches. **vaul is fully superseded** → dropping it keeps one
Base UI primitive foundation (the ADR's goal).

- `Sheet` → **rebuild on the Base UI `Drawer`** — `swipeDirection="down"`, `showSwipeHandle`,
  `Drawer.VirtualKeyboardProvider` for iOS keyboards, safe-area padding, `max-w-[430px]`. **Drop `vaul`.**
- `PromptSheet` → **rebuild** as composition over the Drawer.
- `ActionSheet` → **rebuild on the Base UI `Drawer`** (native swipe replaces the custom motion drag).
  Was "keep on Dialog + `use-drag-to-dismiss`"; the Drawer's native swipe means **`use-drag-to-dismiss`
  is deleted** (see 10). ⚠ Needs `@base-ui/react` at the version that ships `/drawer` — the init
  pulled `^1.6.0`; our dep is `^1.5.0`, so **bump + verify**.
- `ConfirmDialog` → **keep thin wrapper** — migrate internals to the shadcn `AlertDialog` recipe,
  keep the domain confirm wrapper (repeated pattern — earned).
- `FlyoutMenu` → **migrate/rebuild** on shadcn `DropdownMenu` (Base UI). This is the **shared
  trigger** for `OverflowMenuButton` (04) and `SortControl` (06) — settle both here. Update
  `FlyoutMenu.test`.

Call sites adopt the compound idiom; animations via `motion`/Base UI transitions (conventions §8),
honoring `prefers-reduced-motion` and safe areas.
