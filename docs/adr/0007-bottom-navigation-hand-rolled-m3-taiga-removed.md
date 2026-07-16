# ADR-0007: Bottom navigation is hand-rolled to the M3 spec; Taiga UI removed

**Status:** Accepted
**Date:** 2026-07-16
**Supersedes:** the "Bottom navigation" row of ADR-0002

## Context

ADR-0002 assigned bottom navigation to Taiga UI's `TabBar` after finding no alternative: Kendo's
`BottomNavigation` is commercially licensed, standalone bottom-nav libraries are stale (Angular 8/9
era), and Angular Material ships no bottom-nav component.

That search was re-verified against the installed packages and still holds:

- **Angular Material v22.0.4** ships 38 entry points, none nav-bar shaped, and no `MatNavigationBar`
  symbol in its typings. Its nav components — `mat-tab-nav-bar` (a top tab-group header with ink bar
  and pagination), `mat-nav-list`, `mat-sidenav`, `mat-toolbar` — are none of them a mobile bottom nav.
- **Material Web** has `md-navigation-bar`, but only in `labs/`; it never graduated to stable and the
  project is in maintenance mode. Adopting it would mean a new dependency plus a
  `CUSTOM_ELEMENTS_SCHEMA` bridge for a component Google never stabilized.
- **PrimeNG** has no equivalent — `Dock` is a macOS-style dock, `TabMenu` a horizontal tab menu.

What changed is the response, not the finding. Taiga UI cost **12 packages and 36 MB** — plus a global
LESS theme, an icon-asset copy step, an 11-declaration `--tui-*` token bridge, and the `less`
devDependency — to supply exactly one component. Meanwhile `app-nav.ts` already hand-wrote every
non-trivial part of that component: tab visibility, fixed positioning, z-index, and safe-area padding.
Taiga supplied only glyph styling and two icons.

## Decision

**The bottom navigation is hand-rolled to the Material 3 navigation bar spec, and Taiga UI is removed
entirely.**

ADR-0002 already set this precedent for swipeable rows: _"stays custom — no library ships this."_

The nav follows the M3 navigation bar spec rather than ad-hoc markup:

| Element          | Spec                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| Container        | height 80px, `surface-container`                                     |
| Active indicator | 64×32, `corner-full`, `secondary-container`                          |
| Icon             | 24px; active `on-secondary-container`, inactive `on-surface-variant` |
| Label            | `label-medium`; active `on-surface`, inactive `on-surface-variant`   |

M3 was chosen because the app is already Material M3 throughout (35 files) and `styles.scss` already
bridges the `--mat-sys-*` roles to the app's semantic tokens. The nav was the **one surface not
speaking M3** — it rendered in Taiga's design language via a separate `--tui-*` bridge. Building to M3
fixes that inconsistency and costs nothing to theme: dark mode flips through the existing token layer.

Sizing comes from Tailwind utilities (`h-20`, `w-16`/`h-8`, `size-6`, `rounded-full`), per ADR-0001.
The component-scoped `styles` block carries only what utilities do not express: fixed placement with
the `--ms-z-nav` token, and the active-state colour contract keyed off the class `routerLinkActive`
applies — the indicator fills, its icon takes the container ink, the label promotes. `routerLinkActive`
also supplies `aria-current="page"` via `ariaCurrentWhenActive`.

## Consequences

- **Two UI foundations remain** (Material/CDK, PrimeNG) plus Tailwind utilities — down from three.
  ADR-0002's ownership rule is otherwise unchanged.
- **22 packages removed**, not 12. `@maskito/*` (4) and `@ng-web-apis/*` (6) had zero imports in `src/`
  but are **Taiga's own dependency footprint** — `@taiga-ui/cdk` imports `@ng-web-apis/common`, and
  Taiga and Maskito share a maintainer. They were hoisted into `package.json` and only became
  removable once Taiga went. The `less` devDependency existed solely for `taiga-ui-theme.less`.
- `--mat-sys-secondary-container` / `--mat-sys-on-secondary-container` are now pinned in the bridge.
  They were previously unpinned and fell through to `mat.theme()`'s generated azure long tail; the M3
  active indicator reads exactly those roles. They are pinned to `--secondary` /
  `--secondary-foreground` — already a tinted container with its own ink, and theme-aware. Pinning them
  to `--surface-sky` would have been wrong: that is what `surface-container` maps to, so the indicator
  would have been invisible against the bar. This benefits every Material component reading the role,
  not just the nav.
- **The nav's appearance changed by design** — an 80px M3 bar with a pill active indicator, replacing
  Taiga's styling.
- **Accepted deviation: 2 destinations, where M3 specifies 3–5.** Study and Practice cannot become
  destinations — they are deck-scoped flows (`/decks/:deckId/study`, `/quiz`, `/match`) with no
  deck-less entry point, and `study/` has no pages at all (it is the SRS engine). The 2-tab IA is
  deliberate: Home (your content) vs Profile (you); notifications reach via the home-header bell,
  settings and progress via profile. The progress area is also entirely unported. Adding destinations
  to satisfy a count would let the guidance wag the product; the bar is legible with two clear peers,
  and the component is built to spec so a third tab is one array entry in `TABS`.
