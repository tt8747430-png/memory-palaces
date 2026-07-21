# Cluster: Utility hooks & cross-cutting behavior

Type: grilling
Status: resolved
Blocked by: 02

## Question

**No default verdict** — each decided cold. These are non-gesture custom hooks; most are
app-logic utilities with no shadcn overlap (likely "keep"), but each still gets an explicit
decision and a note on whether the migration touches it:

- `use-optimistic-patch` (`use-optimistic-patch.test`) — optimistic RxDB round-trip
  (`docs/CODE_STYLE.md` §10 drop-flicker). Keep unless justified.
- `use-sortable-sensors` — `@dnd-kit` sensor config. Keep (`@dnd-kit` is out-of-scope-additive).
- `use-auto-select`, `use-keyboard-pin` — selection/keyboard helpers. Keep or fold into
  shadcn behavior?
- `sticky-header/use-sticky-header` (+ `elevation`, `elevation.test`) — used by `StickyBar`/
  `ScreenHeader` (Layout 08). Keep.
- `motion` — animation tokens/helpers (`docs/CODE_STYLE.md` §9). Keep; confirm it's not
  replaced by `tw-animate-css` (per conventions ticket 02).

Explicit output per item: verdict + interaction with the migration. A "keep, untouched" is a
valid, recorded decision.

## Answer

All **keep** — app-logic utilities with no shadcn overlap. Recorded per member:

- `use-optimistic-patch` → **keep, untouched** — RxDB optimistic round-trip, `CODE_STYLE.md` §10
  drop-flicker; load-bearing.
- `use-sortable-sensors` → **keep** — `@dnd-kit` sensor config (`@dnd-kit` is out-of-scope-additive).
- `use-auto-select`, `use-keyboard-pin` → **keep** — selection/keyboard helpers, no shadcn behavior
  to fold into.
- `use-sticky-header` (+ `elevation`) → **keep** — used by `StickyBar`/`ScreenHeader` (08).
- `motion` → **keep** — animation tokens/helpers (`CODE_STYLE.md` §9); **not** replaced by
  `tw-animate-css` (conventions §8 makes `motion` the standard).

Migration touches none of these directly; they're consumed as-is.
