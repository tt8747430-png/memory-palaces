# ADR-0003: In-place Angular migration on a dedicated branch, per-file port verification

**Status:** Accepted
**Date:** 2026-07-15
**Context:** The product owner wants one app — the existing app completely refactored to Angular — not an Angular app coexisting with the React app. The earlier "nothing gets deleted" constraint is honored through git, not the working tree.

## Decision

1. **All migration work happens on a dedicated branch** (`angular-migration`). On that branch, the repo root itself becomes the Angular app: Angular CLI tooling replaces the Vite/React toolchain, and `src/` is ported slice by slice. `main` keeps the complete, runnable React app until the branch reaches feature parity and the owner decides to merge. There is never a side-by-side second app.
2. **Per-file port protocol (owner's rule):** a React file may be removed only after it is *completely* ported — every export, behavior, state, edge case (loading/error/empty/offline), i18n key, and test it carries must have a verified Angular equivalent. The check is explicit: enumerate the file's exports/behaviors, map each to its Angular home, and only then delete. Partial ports never delete their source; the React file remains the reference implementation until verification passes.
3. **What carries over identically:** RxDB database name + collection schemas (user data on devices must survive), `shared/lib` pure logic with its colocated tests, the `--sw-*` semantic token palette, and the PWA manifest/service-worker identity (installed apps update in place; no second install).

## Alternatives rejected

- **Side-by-side `angular/` folder in the repo** — rejected by the owner: that is two apps.
- **Converting directly on `main`** — no fallback while ~30 pages are broken mid-port.
- **npm workspaces / Nx to share domain code between both apps** — moot once coexistence is off the table.
