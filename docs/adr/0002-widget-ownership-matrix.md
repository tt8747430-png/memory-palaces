# ADR-0002: Widget ownership matrix — Material, PrimeNG, Taiga UI, lucide

**Status:** Accepted
**Date:** 2026-07-15
**Context:** The Angular migration replaces hand-rolled `shared/ui` components with library components. Each widget category is owned by exactly one library — never two implementations of the same category. Every row below was decided explicitly by the product owner.

## The matrix

| Category | Owner | Replaces |
|---|---|---|
| Bottom sheets / action sheets | `MatBottomSheet` | `Sheet` (vaul), `ActionSheet` |
| Dialogs / modals | `MatDialog` | `@base-ui` dialogs |
| Menus / popovers | PrimeNG `Menu` / `Popover` | `@base-ui` menus |
| Toasts | PrimeNG `Toast` | sonner |
| Form inputs (fields, selects, toggles) | Material form field suite (`MatFormField`, `MatInput`, `MatSelect`, `MatSlideToggle`) | assorted custom inputs |
| Buttons + segmented control | `MatButton` + `MatButtonToggle` | custom buttons, `SegmentedControl` |
| Deck tree with drag-drop | PrimeNG `Tree` (built-in dragdrop) | `@dnd-kit` wiring, `deck-tree` widget, `DropIndicator` |
| Icons | `lucide-angular` (same glyph set as today) | `lucide-react` |
| Cards | `MatCard`, theme-overridden (glass look + rounded-2xl via M3 shape/color tokens) | `GlassCard` |
| Progress / meters | PrimeNG `ProgressBar` + `Knob` | custom bars |
| Bottom navigation | Taiga UI `TabBar` (`@taiga-ui/addon-mobile`) | custom `bottom-nav` widget |
| Swipeable list rows | **stays custom** — no library ships this | `SwipeRow` |

## Consequences

- **Three UI foundations coexist** (Material/CDK, PrimeNG, Taiga UI addon-mobile) plus Tailwind utilities (ADR-0001). Accepted trade-off: each was chosen because it owns its category outright; the ownership rule prevents duplicate idioms.
- **Overlay stacking contract required:** dialogs/sheets render on CDK's overlay stack, menus/toasts on PrimeNG's. A pinned z-index contract between the two stacks is part of the theme setup, so a PrimeNG menu opened from inside a MatDialog always stacks correctly.
- **All three theme systems are fed by the same `--sw-*` semantic tokens** with dark mode driven by one `data-theme` attribute (ADR-0001).
- Kendo `BottomNavigation` (commercial license) and stale solo-maintainer bottom-nav libs (Angular 8/9 era) were evaluated and ruled out; Angular Material verified as shipping no bottom-nav component as of v20 (2026-07).
