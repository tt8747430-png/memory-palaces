# ADR-0005: Platform choices — RxDB (fresh), ngsw, @angular/localize, Vitest builder

**Status:** Accepted
**Date:** 2026-07-15
**Context:** Platform-level library decisions for the Angular migration. Crucial input from the owner: **the RxDB persistence layer is preview-only — no real user data exists on devices**, so no backwards compatibility with stored data is required.

## Decisions

1. **Persistence: RxDB stays, reset to zero-legacy.** RxDB remains the offline-first source of truth (RxJS-based, reactive queries feed `toSignal()` directly; schema + migration machinery is a maintained library, not own-infrastructure). Because no real data exists: all schemas collapse to `version: 0`, the v0→v1 preferences migration is deleted, and the database name/collection naming may be cleaned up freely. From first release onward, the old rule returns: stored data evolves only via RxDB schema migrations.
2. **PWA: `@angular/pwa` + ngsw** replaces Workbox/vite-plugin-pwa. Config-driven caching (`ngsw-config.json`); `SwUpdate` drives the update prompt. No Workbox-takeover concern since no production installs exist.
3. **i18n: Transloco.** Initially decided as `@angular/localize`, revised same day: the owner requires **runtime language switching**, which compile-time `$localize` cannot do (one build per locale). Transloco provides runtime switching, lazy per-feature translation scopes aligned with lazy routes, and a near-mechanical port of the typed `en.ts` catalog.
4. **Testing: Angular CLI Vitest builder.** Pure domain tests (srs, streak, stats, deck-tree…) port verbatim with colocated files and `fake-indexeddb`; component tests use TestBed + Material/CDK component harnesses.
