# Architecture Plan — React + Vite PWA, FSD × Clean Architecture

## Layers

```
app/ → pages/ → widgets/ → features/ → entities/ → shared/
```

Import only from strictly lower layers (lint-enforced). **Clean/Hexagonal sits inside FSD** as the core's dependency
direction:

- **Domain core** (no React/IO): `entities/*/model` (types + invariants) + `shared/lib` (`srs`, `streak`, `stats`,
  `recall`, `deck-tree`, `achievements`, `badges`, `order`, …), each with colocated tests.
- **Ports:** `shared/api/base-repository.ts` (`Repository<T>`) + each entity's typed interface (`entities/<x>/api`).
- **Adapters:** `shared/api/rxdb` (prod) and `in-memory-repository` (tests, and the live `session` store); both are
  held to `shared/test/repository-contract.ts` (Liskov). `shared/api/supabase` (Auth, replication, Storage, account
  deletion) is **shipped** — Phase 9. Cloud ports live in `shared/api` beside `Repository<T>`: `CloudSyncPort`,
  `StoragePort`, `AccountDeletionPort`. The **composition root** in `app/` is async (`createServices()`, awaited by
  `app/Bootstrap.tsx` behind the splash), wires them via DI and calls `start()` on every mirroring store.
- **Rule:** adapters depend on ports, never the reverse → core stays portable + unit-testable.

**CQRS-lite:** `features/*` = commands (writes, one use-case each). Reads = reactive selectors over entity Zustand
stores + RxDB queries. Commands are plain exported functions today; the typed **registry** that would let the AI Tutor
call the same use-cases as the UI is Phase 13 (T13.1), and is the reason one-use-case-per-file is worth keeping now.

## Persistence & cloud

- **RxDB (IndexedDB) is the single on-device truth** — instant, fully offline; reactive queries feed the stores.
- **Supabase behind ports (shipped, Phase 9):** Auth (dev/tests use a guest provider; email/password + Google + Apple
  in prod), replication (RxDB ↔ Postgres over eight mirror tables — decks, cards, folders, questions, progress,
  preferences, profiles, history — field-aware merge: LWW for content, counter-merge for `progress`/`card.srs`,
  first-write-wins for history — so cross-device reviews are never lost), private Storage (deck images, avatars),
  guest → account claim. Edge Functions shipped: `request-account-deletion` and `purge-account` (daily `pg_cron`). The
  Claude proxy Edge Function is still Phase 13.
- **Manual sync (shipped) — replaces always-on replication.** Nothing leaves the device until the learner presses
  Synchronise, or Autosync (device-local, off by default) runs one on reconnect, focus, leaving and after writes settle.
  One Sync (`features/sync/sync-now.ts`) = peek ids since this device's checkpoint → classify against the pending-change
  log → one `live: false` cycle (`SyncManager.runCycle`) → confirm. Only a **destructive divergence** — deleted here,
  changed elsewhere — asks the learner anything. A Realtime watcher only lights the banner (`widgets/sync`). The risk is
  named and accepted: a device lost before Synchronise loses what it had not synced; the permanent banner is the
  mitigation.
- **Leaving the app:** Workbox `BackgroundSyncPlugin` (`vite.config.ts`) still replays a push cut off mid-cycle once the
  browser is back; `navigator.storage.persist()` is requested on sign-in.
- **Images:** buckets are private; documents store the object path; `keepImagesCached` (`features/media`) fetches bytes
  into Cache Storage ahead of the read, and `useImageSrc` reads only that cache.
- **Account lifecycle:** requesting deletion synchronises first, schedules a purge 30 days out and wipes the device;
  signing in before then cancels it and forces a restoring Sync. See ADR 0004 for what is gated offline.
- The whole cloud layer is additive and swappable; it touches no feature or entity logic.

## REST vs replication

Domain data is **not** REST CRUD — it flows through replication (the network is never in the review path). REST is for
surfaces outside the sync stream, all behind `shared/api` ports:

AI Tutor Edge Function (JWT + SSE, commands-as-tools) · Auth (GoTrue) · Storage uploads and signed reads · Web Push
subscriptions · account deletion (shipped: `request-account-deletion`, `purge-account`, the `account_deletions` table) ·
server RPCs (bulk export) · read-only catalogs · PostgREST for the Sync's id-only peek and for admin/debug tooling.

**Payoff:** persistence already sits behind `Repository<T>` + composition-root DI, so a `RestRepository<T>` can back any
server-authoritative entity **without touching entity/feature code**. **Never** put core CRUD, SRS, or streak/stats on
REST.

## Theming

Primitives → semantic roles as CSS variables mapped to Tailwind. Components use **only semantic tokens**. **Dark = a
second semantic→primitive map** via `data-theme`, zero component edits. WCAG AA per pairing, per theme.

## Patterns → layers

Facade `features/*` · Observer (Zustand + RxDB queries + `EventBus`) · Mediator (`EventBus`; command registry to come) ·
Factory (`entities/*/model` `makeX()`, repo factory in the composition root) · State (machines in `features/review`,
`features/quiz`) · Adapter/Strategy (RxDB + in-memory behind `Repository<T>`; anki/csv in `features/content`) ·
Singleton (one object graph per boot, built by `createServices()` and injected — never a module-level instance) ·
Reducer machines (`app/providers/sync-runner-state.ts`, `pages/settings-profile/model/delete-account-machine.ts`) ·
Prototype (`cloneEntity()`).
_Planned:_ Proxy (tutor permission gate) · Builder (LLM-request assembly).

**SOLID:** one-concern entities/features (kills god-hooks) · add adapters/commands behind ports/registries · in-memory ↔
RxDB adapter · narrow ports + selector-scoped reads · core depends on ports.
**DRY:** one command per mutation (UI + tutor reuse it) · domain logic only in `shared/lib` + `entities/model` · tokens
only in the theme · one `cn()`. No premature abstraction.

---

## Phases

Phases 0–8 (design system, walking skeleton, domain core, the entity slices), 9 (cloud, then manual sync, private
storage, history sync and account deletion — `docs/superpowers/specs/2026-09-15-offline-sync-and-account-lifecycle-design.md`)
and 12 (dark theme) are **shipped** — what follows is what is left. Numbering is historical; nothing is missing.

### 10 — Web Push & reminders

- **T10.1** SW push + permission flow; subscriptions in Supabase
- **T10.2** Scheduled sender (`pg_cron`/Edge cron) for due reviews + at-risk streaks; respects quiet hours + prefs.
  `pg_cron` and `pg_net` are already enabled (history trim, account purge) — reuse them, do not re-add
- **T10.3** Badging API for the due count
- **Checkpoint:** opt-in reminders + badging (iOS 16.4+ installed)

### 11 — Hardening & launch

A11y pass (WCAG AA, focus traps, SR labels) · Lighthouse PWA/perf (lazy routes and an async composition root are done;
virtualization, bundle budget remain) · import from the old app · deploy to Vercel + Supabase (apply migrations, deploy
Edge Functions, enable `pg_cron`/`pg_net`, store `project_url` + `service_role_key` in Vault) · dead-code removal.

- **T11.G — Guard the developer surface before 1.0.** The Settings → **Developer** section and the `/dev/kitchen-sink`
  route (`ROUTES.devKitchenSink`) are deliberately built into **every** build, production included, because the iOS
  keyboard bugs behind [ADR 0002](adr/0002-keyboard-covers-the-app.md) are only reproducible in the installed PWA over
  HTTPS — a `import.meta.env.DEV` gate put the one diagnostic we needed out of reach of the one environment that shows
  the bug. **That trade expires at 1.0.** The flag already exists (`useDevMode()`/`setDevMode()`,
  `shared/lib/dev-mode.ts`) but **currently gates nothing** — it is a toggle _inside_ the Developer section, which
  renders unconditionally. Ship it guarded: wrap that section in `useDevMode()`, give dev mode an unadvertised way in
  (the convention is tapping the version on Settings → About seven times), and leave the route reachable but unlisted.
  Do _not_ simply delete the route — the probe is the reason three keyboard fixes stopped being guesswork.
- **Checkpoint:** acceptance criteria met, Lighthouse installable + green, deployed, **no developer surface reachable
  from a first-run install**.

### 13 — AI Tutor (last)

- **T13.1** Command-registry consolidation — every mutation a typed, zod-schema'd command
- **T13.2** Permission proxy — tutor commands require explicit confirmation
- **T13.3** Claude Edge Function (JWT-verified, per-user rate limit + token budget) with tool use, user-scoped,
  streaming. _Verify:_ "create a palace called X" end-to-end behind the gate
- **T13.4** `widgets/TutorChat` + `pages/tutor` + tutor store (turn machine)
- **Checkpoint:** tutor drives create/edit/search/generate, every action gated
