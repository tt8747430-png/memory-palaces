# Architecture Plan — React + Vite PWA, FSD × Clean Architecture

## Layers

```
app/ → pages/ → widgets/ → features/ → entities/ → shared/
```

Import only from strictly lower layers (lint-enforced). **Clean/Hexagonal sits inside FSD** as the core's dependency direction:

- **Domain core** (no React/IO): `entities/*/model` (types + invariants) + `shared/lib` (SRS, streak, stats, dueCards).
- **Ports:** each entity's repository interface (`entities/<x>/api`).
- **Adapters:** `shared/api/rxdb`, `shared/api/supabase`, plus in-memory for tests (Liskov). The **composition root** in `app/` wires them via DI.
- **Rule:** adapters depend on ports, never the reverse → core stays portable + unit-testable.

**CQRS-lite:** `features/*` = commands (writes, one use-case each), shared by UI _and_ the AI Tutor via the command registry. Reads = reactive selectors over entity Zustand stores + RxDB queries.

## Persistence & cloud

- **RxDB (IndexedDB) is the single on-device truth** — instant, fully offline; reactive queries feed the stores.
- **Supabase behind ports:** Auth (dev/tests use a guest provider), replication (RxDB ↔ Postgres, per-doc revisions + append-only merge so cross-device reviews are never lost), Storage, Edge Function (Claude proxy — the app never holds the key).
- **Always-in-sync-on-leave:** live replication → flush on `visibilitychange`/`pagehide` → Workbox `BackgroundSyncPlugin` delivers queued changes after the tab closes.
- The whole cloud layer is additive and swappable; it touches no feature or entity logic.

## REST vs replication

Domain data is **not** REST CRUD — it flows through replication (the network is never in the review path). REST is for surfaces outside the sync stream, all behind `shared/api` ports:

AI Tutor Edge Function (JWT + SSE, commands-as-tools) · Auth (GoTrue) · Storage uploads · Web Push subscriptions · server RPCs (guest→account merge, GDPR deletion, bulk export) · read-only catalogs · PostgREST for admin/debug tooling.

**Payoff:** persistence already sits behind `Repository<T>` + composition-root DI, so a `RestRepository<T>` can back any server-authoritative entity **without touching entity/feature code**. **Never** put core CRUD, SRS, or streak/stats on REST.

## Theming

Primitives → semantic roles as CSS variables mapped to Tailwind. Components use **only semantic tokens**. **Dark = a second semantic→primitive map** via `data-theme`, zero component edits. WCAG AA per pairing, per theme.

## Patterns → layers

Facade `features/*` · Observer (Zustand + RxDB queries + EventBus; flush-on-leave observes visibility) · Mediator (command registry + EventBus) · Proxy (tutor permission gate; lazy-load for Anki import) · Factory (`entities/*/model`, repo factory in the composition root) · State (machines in `features/review`, `features/quiz`, study session, tutor turn) · Adapter/Strategy (RxDB/Supabase; anki/csv/json) · Singleton (composition-root singletons, injected) · Prototype (`clone()`) · Builder (create flow, LLM-request assembly).

**SOLID:** one-concern entities/features (kills god-hooks) · add adapters/commands behind ports/registries · in-memory ↔ RxDB adapter · narrow ports + selector-scoped reads · core depends on ports.
**DRY:** one command per mutation (UI + tutor reuse it) · domain logic only in `shared/lib` + `entities/model` · tokens only in the theme · one `cn()`. No premature abstraction.

---

## Phases

### 9 — Cloud + always-on sync (Supabase)

- **T9.1** Postgres schema mirroring entities + RLS
- **T9.2** Supabase Auth adapter for `AuthProvider`; swap at the composition root
- **T9.3** RxDB ↔ Supabase replication + conflicts (per-doc revisions, server time, append-only merge, tombstones). _Verify:_ two-client + offline-merge tests
- **T9.4** Sync-on-leave flush + Workbox Background Sync + `navigator.storage.persist()`
- **T9.5** Storage — palace images, offline-graceful
- **T9.6** Guest → account claim (migrate local RxDB on first sign-up). _Verify:_ guest → signup → second device
- **Checkpoint:** real accounts, guest claim, cross-device sync, storage — still fully usable offline

### 10 — Web Push & reminders

- **T10.1** SW push + permission flow; subscriptions in Supabase
- **T10.2** Scheduled sender (`pg_cron`/Edge cron) for due reviews + at-risk streaks; respects quiet hours + prefs
- **T10.3** Badging API for the due count
- **Checkpoint:** opt-in reminders + badging (iOS 16.4+ installed)

### 11 — Hardening & launch

A11y pass (WCAG AA, focus traps, SR labels) · Lighthouse PWA/perf (lazy routes, virtualization, bundle budget) · import from the old app · deploy to Vercel + Supabase · dead-code removal.

- **T11.G — Guard the developer surface before 1.0.** The Settings → **Developer** section and the `/dev/kitchen-sink` route (`ROUTES.devKitchenSink`) are deliberately built into **every** build, production included, because the iOS keyboard bugs behind [ADR 0002](adr/0002-keyboard-covers-the-app.md) are only reproducible in the installed PWA over HTTPS — a `import.meta.env.DEV` gate put the one diagnostic we needed out of reach of the one environment that shows the bug. **That trade expires at 1.0.** Ship it guarded: gate the Settings section on `useDevMode()` (`shared/lib/dev-mode.ts`) and give dev mode an unadvertised way in (the convention is tapping the version on Settings → About seven times), leaving the route reachable but unlisted. Do _not_ simply delete the route — the probe is the reason three keyboard fixes stopped being guesswork.
- **Checkpoint:** acceptance criteria met, Lighthouse installable + green, deployed, **no developer surface reachable from a first-run install**.

### 13 — AI Tutor (last)

- **T13.1** Command-registry consolidation — every mutation a typed, zod-schema'd command
- **T13.2** Permission proxy — tutor commands require explicit confirmation
- **T13.3** Claude Edge Function (JWT-verified, per-user rate limit + token budget) with tool use, user-scoped, streaming. _Verify:_ "create a palace called X" end-to-end behind the gate
- **T13.4** `widgets/TutorChat` + `pages/tutor` + tutor store (turn machine)
- **Checkpoint:** tutor drives create/edit/search/generate, every action gated
