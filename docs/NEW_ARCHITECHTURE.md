# Plan: New Architecture for Mindscape — React + Vite **PWA**, **Feature-Sliced Design + Clean Architecture**

### Cross-cutting engineering defaults (applied in every relevant phase)

- **Offline UX:**

---

## Architecture: Feature-Sliced Design × Clean Architecture

**FSD layers** (a module may import only from layers **strictly below** it — enforced by lint):

```
app/      → pages/ → widgets/ → features/ → entities/ → shared/
```

**Clean/Hexagonal** sits _inside_ FSD as the dependency direction of the core:

- **Domain core (framework-agnostic, no React/IO):** `entities/*/model` (entity types + invariants) + `shared/lib` (pure algorithms: SRS, streak, stats, dueCards, verse).
- **Ports (interfaces):** each entity's repository interface (`entities/<x>/api`).
- **Adapters:** `shared/api/rxdb` + `shared/api/supabase` implement the ports; an **in-memory** adapter backs tests (Liskov). The **composition root** in `app/` wires adapters into ports via DI.
- **Dependency rule:** outer layers depend on inner; adapters depend on ports, never the reverse → the core is portable + unit-testable.

**CQRS-lite:** `features/*` are the **commands** (writes; one use-case each), shared by the UI _and_ the AI Tutor through the command registry; **reads** are reactive selectors over entity Zustand stores + RxDB reactive queries.



### Persistence, cloud & "always in sync"

- **RxDB (IndexedDB) is the single source of truth on device** — instant, fully offline; reactive queries feed the stores (Observer).
- **Supabase is the cloud, behind ports** (`shared/api`): **Auth** (real accounts; dev/tests use a local/guest provider), **replication** (RxDB ↔ Postgres, per-doc revisions + append-only merge so cross-device reviews are never lost), **Storage** (palace images), **Edge Function** (Claude proxy — app never holds the key).
- **Always-in-sync-on-leave:** live replication while active → **flush** on `visibilitychange`/`pagehide` → Workbox **`BackgroundSyncPlugin`** delivers offline-queued changes after the tab closes.
- **Dependency Inversion guarantee:** the whole cloud layer is additive/swappable behind ports — it touches no feature/entity logic.

### REST / HTTP API surface (and what stays on replication)

The domain data is **not** served by REST CRUD — flow through **RxDB ↔ Supabase replication** (offline-first; network never in the
review path). REST/HTTP request–response is reserved for surfaces that don't belong
in the sync stream, all behind `shared/api` ports:

- **AI Tutor (Phase 13)** — the Claude Edge Function is the clearest REST fit:
  JWT-verified POST + SSE streaming, commands-as-tools.
- **Auth (Phase 9)** — Supabase Auth/GoTrue is REST: sign-up/in, token refresh,
  password reset, magic link, guest→account claim.
- **Storage (Phase 9)** — palace images / avatars via signed-URL or multipart POST.
- **Web Push (Phase 10)** — POST to persist a `PushSubscription`; the pg_cron/Edge
  sender calls the Web Push REST endpoints.
- **Server RPCs outside the sync stream** — guest→account merge, account deletion
  (GDPR), bulk export.
- **Read-only catalogs** — a community/shared-palace template gallery or AI-generation
  results: plain REST GET/POST, no RxDB collection or merge logic needed.
- **"Free" REST via PostgREST** — once the Phase 9 schema + RLS exist, Supabase
  auto-exposes a REST API for admin/debug tooling, server-to-server, and integrations.

**Architectural payoff:** persistence already sits behind the generic `Repository<T>`
port (`shared/api/base-repository.ts`) + composition-root DI, so a `RestRepository<T>`
adapter can back any entity needing server-authoritative request/response (e.g. a
future thin client without RxDB) **without touching entity/feature code** — REST is an
optional adapter, never a rewrite. **Do not** add REST to core CRUD, SRS, or
streak/stats — those stay local + replication.

### Design system & theming (color architecture)

- Two-layer tokens: **primitives** (`shared/config` or `app` theme: `navy-900 #091A7A`, scales, glass, neutrals, status) → **semantic roles** (`bg`, `surface`, `surface-glass`, `text-primary/secondary/muted`, `primary`, `accent`, `success/warning/danger`) exposed as **CSS variables** mapped to Tailwind.
- Components use **only semantic tokens**, never raw hex (DRY single source of truth). **Dark = a second semantic→primitive map** via `data-theme`/`prefers-color-scheme`, no component edits. WCAG 2.1 AA verified per pairing in each theme.

---

## Design patterns (mapped to FSD layers)

- **Facade** → `features/*` use-cases + entity services present one call over multistep ops (e.g. complete-room).
- **Observer** → Zustand subscriptions + RxDB reactive queries + `shared/api` EventBus (ProgressEvents); sync flush-on-leave observes visibility.
- **Mediator** → command registry + EventBus decouple features from each other.
- **Proxy** → AI Tutor permission gate wrapping feature-command execution; lazy-load proxy for Anki import.
- **Factory** → entity factories in `entities/*/model`; repository factory in the composition root.
- **State** → discriminated-union machines in `features/review`, `features/quiz`, `widgets/StudySession`, tutor turn.
- **Adapter / Strategy** → RxDB/Supabase adapters; anki/csv/json transfer strategies.
- **Singleton** → composition-root module singletons (repos, EventBus, sync, clients), injected.
- **Prototype** → `clone()` for duplicate palace/room/locus/question.
- **Builder** → create-palace flow + LLM-request assembly.
- _(Iterator: native JS; at most a study-session cursor.)_

## SOLID + DRY

- **S** one-concern entities/features (kills the god-hook + god-components). **O** add adapters/formats/commands behind ports/registries. **L** in-memory adapter ↔ RxDB adapter. **I** narrow repo ports + selector-scoped reads. **D** core depends on ports, not RxDB/Supabase; composition root injects.
- **DRY:** one command per mutation (UI + tutor reuse it); domain logic only in `shared/lib` + `entities/model`; tokens only in theme; consolidate `cn()`. Balance: no premature abstraction (role.md).

---

## Phased, vertically-sliced task plan

### Phase 9 — Cloud + always-on sync (Supabase)

- **T9.1** Supabase Postgres schema mirroring entities + **RLS**.
- **T9.2** Supabase **Auth** adapter for `AuthProvider`; swap at composition root.
- **T9.3** **RxDB ↔ Supabase replication** + conflict handling (per-doc revisions, server-time, append-only merge, tombstones). _Verify:_ two-client + offline-merge tests.
- **T9.4** **Sync-on-leave** (`visibilitychange`/`pagehide` flush) + Workbox **Background Sync** + `navigator.storage.persist()`.
- **T9.5** **Storage** — palace images to Supabase Storage, offline-graceful.
- **T9.6** **Guest → account claim** — migrate local RxDB data into the new account on first sign-up. _Verify:_ guest → signup → second-device.
- **Checkpoint 9:** real accounts + guest-claim + always-on cross-device sync + storage; still fully usable offline.

### Phase 10 — Web Push & reminders

- **T10.1** SW push + permission flow; store subscriptions in Supabase.
- **T10.2** **Scheduled sender** (`pg_cron`/Edge cron) for due reviews + at-risk streaks; respects quiet hours + prefs.
- **T10.3** **Badging API** for due-card count.
- **Checkpoint 10:** opt-in reminders + badging (iOS 16.4+ installed).

### Phase 11 — Hardening & launch

- A11y pass (WCAG AA, focus traps, SR labels), **Lighthouse PWA/perf** (lazy routes, virtualization, bundle budget), data-import from the old app, deploy to **Vercel** (+ Supabase), dead-code removal, consolidate `cn()`.
- **Checkpoint 11:** acceptance criteria met; Lighthouse installable + green; deployed.

### Phase 13 — AI Tutor (the very last phase)

- **T13.1** Command registry consolidation — every mutation is a typed, zod-schema'd command (single source of intents).
- **T13.2** **Permission proxy** — tutor commands require explicit confirmation (role.md).
- **T13.3** **Claude Edge Function** (JWT-verified, per-user rate-limit + token budget) calls Claude with **tool use** (commands as tools, user-scoped; streaming). Latest models (e.g. `claude-opus-4-8`/`claude-sonnet-4-6`). _Verify:_ "create a palace called X" end-to-end behind the gate.
- **T13.4** `widgets/TutorChat` + `pages/tutor` + tutor store (turn State machine).
- **Checkpoint 13:** tutor drives create/edit/search/generate, every action gated, via the Edge Function.