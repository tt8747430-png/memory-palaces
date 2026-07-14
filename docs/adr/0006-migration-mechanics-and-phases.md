# ADR-0006: Migration mechanics, phase order, definitions of done

**Status:** Accepted
**Date:** 2026-07-15
**Context:** Closes the migration interview (ADRs 0001–0005). Defines how the in-place refactor on `angular-migration` actually runs.

## Mechanics

- On branch `angular-migration`, the React tree (source + Vite tooling) moves to `legacy-react/`, excluded from the Angular build — the frozen reference implementation. The repo root becomes the Angular app.
- **Per-file port protocol:** enumerate the file's exports, behaviors, UI states (loading/error/empty/offline), i18n keys, and tests → map each to its Angular home → verify green → only then delete the file from `legacy-react/`. Partial ports never delete their source.
- Tracking: `.scratch/angular-migration/port-tracker.md`, one row per file (`ported-by`, `verified`, `deleted`). **Parity = `legacy-react/` is empty.**

## Phase order (each phase ends with `ng build` + tests green)

1. **Scaffold & toolchain** — Angular CLI (latest stable) at root; ESLint/Prettier; Vitest builder; Tailwind v4; Angular Material; PrimeNG; Taiga UI `addon-mobile`; `lucide-angular`; `@angular/pwa`; Transloco.
2. **Theme bridge** — `--sw-*` tokens feeding M3 theme + PrimeNG preset + Taiga; `data-theme` dark mode; overlay z-index contract; typography.
3. **Domain core** — pure libs + tests verbatim (srs, streak, stats, recall, deck-tree, achievements, badges, order, naming); entity types/factories.
4. **Data layer** — RxDB service (fresh v0 schemas), `Repository<T>` port + RxDB/in-memory adapters, entity signal stores, feature commands.
5. **App shell** — lazy routes, functional auth guard (reusing `authRedirect`), Taiga TabBar bottom nav, splash, `SwUpdate` prompt.
6. **Feature areas, dependency-ordered** — decks → study → practice (quiz/match) → progress (achievements/badges/streak) → settings → auth pages → notifications → import.
7. **Closeout** — ngsw config, Transloco catalog, AXE/WCAG AA pass, docs rewrite (CLAUDE.md, CODE_STYLE.md, MOBILE_DESIGN.md), delete emptied `legacy-react/`.

## Definitions of done

- **Per page:** all four UI states; WCAG AA / AXE clean; library components only (ADR-0002); typecheck + lint + tests green; source file's checklist complete and the file deleted.
- **For merge:** `legacy-react/` empty; full suite green; PWA installs and updates in place; owner's parity walkthrough. **Merge is the owner's call, never automatic.**
