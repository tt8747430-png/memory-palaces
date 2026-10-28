# Audit the UI and app shell

From the owner's early prompt. It has not been run yet: no findings file exists.

## Goal

A list of everything broken, dead, outdated or inconsistent in the UI and the app shell, each finding proven. **Audit only: fix nothing.** The owner chooses what gets fixed.

## Context

- Read `CLAUDE.md`, `docs/CODE_STYLE.md` (UI kit, layout and mobile, motion, drag and drop), the ADRs on drag and drop and on the keyboard (`docs/adr/README.md`), `docs/UBIQUITOUS_LANGUAGE.md` and `docs/HISTORY.md` before judging anything. Check whether the docs themselves are right.
- Skills: `diagnosing-bugs` for any suspected bug, `web-design-guidelines` for the a11y and UX pass, `vite-react-best-practices` and `vercel-react-best-practices` for performance and bundle, `codebase-design` for structure. Verify with grep and tests, never from memory.
- **Scope:** the whole UI, and explicitly `src/styles/{tokens,theme,index}.css`, `src/shared/ui/**` (`AppScreen`, `header/`, `Sheet`, `ActionSheet`, `SpeedDial`, `FooterBar`, `BottomDock`, `BottomSlot`), `src/widgets/**`, `src/pages/**`, `src/app/{router,composition-root,RootLayout}.*`, and `src/shared/lib/{event-bus,events,motion,keyboard-viewport,gestures}.ts`.

## Task

Run `npm run typecheck && npm run lint && npm run test` first and record the baseline. Then run every pass and report each separately:

1. **Tokens:** declared and never used; used and never declared; on `:root` with no `[data-theme='dark']` counterpart; one value under two names; `theme.css` rules overridden elsewhere.
2. **Tailwind:** v3 classes that do nothing in v4; arbitrary values (`rounded-[Npx]`, `z-[N]`) that bypass an existing token; class strings built at runtime the compiler never sees; `cn()` calls where two conflicting utilities survive.
3. **Stacking and insets:** the z-index ladder across the bottom nav, `SpeedDial`, the select toolbar, `Sheet`, `ActionSheet`, `FooterBar` and toasts: overlaps, wrong order, unreachable controls. `env(safe-area-*)` counted twice. Misuse of `--app-height` or `--kb-range`. Anything that moves the header when the keyboard opens.
4. **Screen frame:** `AppScreen` and the header used inconsistently across the pages: two paddings for one slot, a page rebuilding what the frame provides, a page without the frame. List the outliers only.
5. **Event bus** (`shared/lib/events.ts`): events published with no subscriber, subscribers to events never published, subscriptions without cleanup, emits during render.
6. **Wiring:** stores in `composition-root` without `start()`, screens reading a store without gating on `selectIsReady`, writes outside `features/**`, deep cross-slice imports that dodge a barrel, barrel exports nothing imports.
7. **Screen states:** for every route, loading, error, empty and offline. Name each screen missing a state, and which.
8. **i18n:** literal user-facing strings outside `shared/i18n/locales/en/`, keys never used, keys used and missing.
9. **Persistence:** in `app/persistence/schemas.ts`, type fields missing from the schema, a version bumped without a migration, a required field added without a default.
10. **Dead weight:** components, pages, routes and assets nothing reaches; commented-out blocks; props accepted and never read.

## Constraints

- **Evidence rule:** every finding needs `file:line`, the concrete trigger (device, route, state) and the wrong outcome you can observe. A finding without a trigger goes in a separate "unverified suspicion" list. No "consider refactoring", no style opinions.
- Change no code.

## Done means

`.scratch/ui-audit/findings.md` exists, grouped by pass. Each finding has a severity (broken / inconsistent / dead / risky), `file:line`, trigger, wrong outcome and the smallest fix, sorted by severity within its pass.

## Report

The baseline test result, then the 10 worst findings, one line each.
