# Plan: New Architecture for Mindscape — React + Vite **PWA**, **Feature-Sliced Design + Clean Architecture**

> **Model update (post-plan):** the organizing model has been refactored from the fixed
> `Folder → Palace → Room → Locus` chain to a recursive **`Folder → Deck → Subdeck(∞) → Card`**
> tree (a single self-referential `Deck` entity; a subdeck is a deck with a deck parent).
> See `CONTEXT.md` and `docs/adr/0001-recursive-deck-replaces-palace-room.md`. Where this
> document says palace/room/locus below, read deck/subdeck/card.

## Context

Mindscape ("Your Memory Palace") is a phone-first method-of-loci training app — today a polished but structurally weak React 18 + Vite + Capacitor web SPA (~26k LOC) with a 1444-line god-hook, 900–1800-line god-components, no router, no layering, no tests. We are doing a **structured big-bang rewrite into a new, separate repository**, with the old app kept as the reference spec.

**Goal:** a clean, **Feature-Sliced + Clean-Architecture** codebase delivered as an **offline-first PWA** (installed from the browser — _no app stores_), with a local DB **always kept in sync** with the cloud, a framework-agnostic + fully testable domain core, explicit design patterns + SOLID/DRY, and a first-class **AI Tutor** built last.

### Confirmed decisions

| Decision          | Choice                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Location**      | New **separate, non-nested** project at **`/Users/kristianbraila/projectsGIT/web/memory-palaces/`** — a top-level _sibling_ of the old `memory-palaces-app-ui/`, not nested inside it. _(Moved here 2026-06-15 from the original `memory-palaces-app-ui/memory-palaces/` subfolder; the nested folder is now empty. Standalone `git init` deferred per the user.)_ Old app = reference spec. |
| **Architecture**  | **Feature-Sliced Design (FSD)** structure × **Clean/Hexagonal** dependency rule × **DDD-lite** domain × **CQRS-lite** (commands/queries) × unidirectional **Zustand**                                                                                                                                                                                                                        |
| **Delivery**      | **PWA** — installable from the browser, instant updates, **no App Store / Play Store**                                                                                                                                                                                                                                                                                                       |
| **Framework**     | **React 19 + Vite** + `vite-plugin-pwa` (Workbox)                                                                                                                                                                                                                                                                                                                                            |
| **UI**            | **shadcn pattern (own-your-code) + Base UI v1.3 primitives** + Tailwind v4 + lucide + sonner/vaul/cmdk + `motion` (not a pre-styled kit)                                                                                                                                                                                                                                                     |
| **Local DB**      | **RxDB over IndexedDB** — on-device source of truth (offline-first, reactive)                                                                                                                                                                                                                                                                                                                |
| **Cloud**         | **Supabase** — Auth, Postgres (replication target), Storage, Edge Function (Claude proxy)                                                                                                                                                                                                                                                                                                    |
| **Hosting**       | **Vercel** (PWA) + Supabase backend                                                                                                                                                                                                                                                                                                                                                          |
| **Router**        | **TanStack Router** (typed, lazy routes)                                                                                                                                                                                                                                                                                                                                                     |
| **Sync**          | **RxDB ↔ Supabase**, _always in sync_: live while active + **flush on app-leave** + Workbox **Background Sync**                                                                                                                                                                                                                                                                              |
| **Onboarding**    | **Guest / local-first**; optional account later **claims** local data on sign-up                                                                                                                                                                                                                                                                                                             |
| **i18n**          | **i18next** from day one (English v1, structure ready)                                                                                                                                                                                                                                                                                                                                       |
| **Reminders**     | **Web Push** (streak / due-review) + Badging                                                                                                                                                                                                                                                                                                                                                 |
| **Migration**     | **Big-bang rewrite** (structured, dependency-ordered)                                                                                                                                                                                                                                                                                                                                        |
| **AI Tutor**      | **In scope**, **final phase**, via a JWT-verified Supabase Edge Function                                                                                                                                                                                                                                                                                                                     |
| **Native later?** | Not now. Kept cheap: the domain core (`entities/model` + `shared/lib`) is framework-agnostic, reusable by a future native app.                                                                                                                                                                                                                                                               |

### Cross-cutting principles

- **Design-first:** extract the full design system via **impeccable** (`/impeccable extract`) on `PRODUCT.md`/`DESIGN.md`/old app **before** any UI.
- **Mobile-first & responsive**, safe-area, accessible font scaling, ≥44px targets.
- **Theme-ready color:** components use only **semantic CSS-variable tokens**; dark theme = a later token remap.
- **Offline-first / local-first:** network never in the path of a card review; cloud is additive behind ports.
- **Comments sparingly:** comment _why_ (intent, trade-offs, gotchas), not _what_ the code already says; prefer clear names + small functions; no redundant/placeholder noise; delete stale comments — don't pollute the code.
- **AI Tutor is the final phase.**

### Cross-cutting engineering defaults (applied in every relevant phase)

- **Sync correctness:** merge append-only data (review history, training days), **server-time** timestamps, soft-delete tombstones, dual RxDB+Postgres migrations.
- **Storage durability:** `navigator.storage.persist()`; cloud safety-net vs iOS PWA eviction.
- **AI safety/cost:** Edge Function verifies the Supabase JWT, rate-limits per user, enforces a token budget; tutor tool args zod-validated + user-scoped; streaming.
- **Performance:** lazy route code-splitting, list virtualization (TanStack Virtual), optimistic UI, image CDN/transforms, bundle budget.
- **Offline UX:** visible sync status + SW update-available prompt.
- **Accessibility:** focus traps, SR labels, keyboard nav, reduced-motion fallbacks, never color-as-sole-indicator.
- **CI/CD & envs:** CI (typecheck/lint/test/build + Lighthouse CI + **FSD boundary lint**), PR preview deploys, dev/staging/prod Supabase, migrations in CI, automated DB backups, secrets only in Supabase.
- _(Deferred by choice: observability/analytics — revisit at/after launch.)_

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

**State:** per-entity Zustand store slices live in `entities/<x>/model` (FSD-idiomatic colocation); cross-entity orchestration lives in `features/`. This replaces the old single god-hook.

### Folder structure (`memory-palaces/`)

```
src/
  app/        # init: providers, TanStack Router, PWA registration, composition root (DI),
              #   ThemeProvider, i18n, EventBus wiring, global styles
  pages/      # route screens: (auth), home, palaces, palace-detail, room(detail/train/verses/match),
              #   quiz, review, settings, tutor
  widgets/    # composite blocks: PalaceList, RoomJourneyMap, StudySession, StreakCalendar,
              #   NotificationsPanel, SyncStatus, TutorChat
  features/   # use-cases = COMMANDS: create-palace, edit-palace, delete/duplicate-palace,
              #   create/reorder-room, edit-locus, review-card, grade-card, run-quiz,
              #   import-content, export-content, sign-in, claim-guest-data, generate-loci(ai)…
  entities/   # business entities, each with model/ (types+store slice+factories+clone), api/ (repo port), ui/
              #   palace, room, locus, question, folder, progress(xp/streak), user/profile, preferences
  shared/
    ui/       # shadcn + Base UI kit + GlassCard, Chip, ScreenHeader, IconButton, GradeButtons, SrsStatusChip
    lib/      # PURE domain: srs, dueCards, streak, stats, verse  + clock, cn, haptics, sound, speech
    api/      # RxDB setup, Supabase client, EventBus, base repository, sync engine, Edge-Function calls
    config/   # env, constants, route ids
    i18n/     # i18next setup + en locale
public/ + vite.config (PWA) + supabase/ (SQL migrations, RLS, edge functions)
```

### Technology mapping (current → target)

| Concern              | Today                 | Target                                                      |
| -------------------- | --------------------- | ----------------------------------------------------------- |
| Delivery             | Capacitor             | **PWA** (`vite-plugin-pwa` / Workbox) — drop Capacitor      |
| Framework            | React 18 + Vite       | **React 19 + Vite**                                         |
| Structure            | flat, god-files       | **FSD layers + Clean dependency rule** (lint-enforced)      |
| Navigation           | state machines        | **TanStack Router** (typed, lazy routes)                    |
| State                | god-hook              | **Zustand** per-entity slices + reactive selectors          |
| Local DB             | localStorage          | **RxDB / IndexedDB** (reactive, offline-first)              |
| Cloud sync           | none                  | **RxDB ↔ Supabase** (always-on)                             |
| Auth                 | mock flag             | **Supabase Auth** + **guest** AuthProvider                  |
| UI components        | shadcn + base-ui      | **shadcn pattern + Base UI v1.3** (headless)                |
| Styling/theme        | Tailwind v4           | **Tailwind v4 + CSS-variable semantic tokens** (light/dark) |
| Animation / gestures | motion / use-gesture  | **keep**                                                    |
| Glass/blur           | CSS `backdrop-filter` | **keep** (full DOM/CSS control)                             |
| Anki import          | sql.js + fflate       | **keep** (web)                                              |
| i18n                 | language pref only    | **i18next**                                                 |
| Tests                | none                  | **Vitest + RTL**; **Playwright** E2E (incl. offline/sync)   |

### Persistence, cloud & "always in sync"

- **RxDB (IndexedDB) is the single source of truth on device** — instant, fully offline; reactive queries feed the stores (Observer).
- **Supabase is the cloud, behind ports** (`shared/api`): **Auth** (real accounts; dev/tests use a local/guest provider), **replication** (RxDB ↔ Postgres, per-doc revisions + append-only merge so cross-device reviews are never lost), **Storage** (palace images), **Edge Function** (Claude proxy — app never holds the key).
- **Always-in-sync-on-leave:** live replication while active → **flush** on `visibilitychange`/`pagehide` → Workbox **`BackgroundSyncPlugin`** delivers offline-queued changes after the tab closes.
- **Dependency Inversion guarantee:** the whole cloud layer is additive/swappable behind ports — it touches no feature/entity logic.

### REST / HTTP API surface (and what stays on replication)

The domain data is **not** served by REST CRUD — palaces/rooms/loci/questions/SRS
flow through **RxDB ↔ Supabase replication** (offline-first; network never in the
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

### PWA specifics

- `vite-plugin-pwa` runs **Workbox** (current standard; supersedes sw-precache/sw-toolbox): precache shell, runtime-cache Storage images, offline fallback, update-prompt.
- Web App Manifest (maskable icons, standalone) → installable; generate assets with **PWA Asset Generator**.
- iOS PWA caveats handled (safe-area, status-bar, custom A2HS hint, persisted-storage request).

### Design system & theming (color architecture)

- Two-layer tokens: **primitives** (`shared/config` or `app` theme: `navy-900 #091A7A`, scales, glass, neutrals, status) → **semantic roles** (`bg`, `surface`, `surface-glass`, `text-primary/secondary/muted`, `primary`, `accent`, `success/warning/danger`) exposed as **CSS variables** mapped to Tailwind.
- Components use **only semantic tokens**, never raw hex (DRY single source of truth). **Dark = a second semantic→primitive map** via `data-theme`/`prefers-color-scheme`, no component edits. WCAG 2.1 AA verified per pairing in each theme.

---

## Design patterns (mapped to FSD layers)

- **Facade** → `features/*` use-cases + entity services present one call over multi-step ops (e.g. complete-room).
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

Each feature slice spans the FSD layers it needs (entity → feature command → widget → page) and leaves the app runnable. Every task has acceptance criteria + verification (`tsc --noEmit`, `vitest`, `vite build`, FSD-boundary lint, Lighthouse, Playwright). Later phases decompose at their opening checkpoint.

> **Order:** design extraction **first**; cloud/sync, then Web Push, then hardening, then **dark theme**, then **AI Tutor last**.

### Phase 0 — Design system extraction (no app code)

- **T0.1** `/impeccable extract` on `PRODUCT.md`/`DESIGN.md`/old app → `memory-palaces/docs/DESIGN_SYSTEM.md` + tokens spec. _AC:_ covers every token category.
- **T0.2** Two-layer token model (primitives + semantic roles), light map + dark placeholders, WCAG AA contrast documented. _AC:_ no raw hex left for components.
- **Checkpoint 0:** design system approved before any UI.

### Phase 1 — Foundation / walking skeleton

- **T1.1** New repo in `memory-palaces/` (`git init`, parent `.gitignore`); scaffold **Vite + React 19 + TS strict**, **TanStack Router**, **Tailwind v4**, **vite-plugin-pwa**, **Vitest + RTL**, **i18next**, ESLint/Prettier + **FSD boundary lint** (eslint-plugin-boundaries / Steiger); **CI** + PR preview deploys. _AC:_ installable PWA shell boots; CI + scripts pass; layer lint active.
- **T1.2** `shared/` foundation — **theme system** (CSS-variable tokens + light map, dark stubbed, ThemeProvider; mobile-first + safe-area + reduced-motion), `shared/ui` kit init (shadcn + Base UI), EventBus, base repository. _AC:_ sample screen styled only with semantic tokens; theme swappable.
- **T1.3** `app/` **composition root + DI** + in-memory adapter + empty entity store slice. _AC:_ a slice reads/writes through an injected in-memory repo. _Verify:_ DI-swap unit test.
- **T1.4** **Walking skeleton** — `user` session + **guest `AuthProvider`** (fully usable offline, no sign-up; Supabase + claim in Phase 9) + Home `page` from a store. _AC:_ one end-to-end path; usable as guest.
- **Checkpoint 1:** installable PWA boots; typecheck/lint(+boundaries)/tests green; DI + theming live.

### Phase 2 — Domain core (framework-free, fully tested)

- **T2.1** `entities/*/model` (palace/room/locus/question/folder/progress) — types + factories + `clone()` + invariants. _AC:_ pure, no React; unit-tested.
- **T2.2** `shared/lib` pure algorithms — SRS (SM-2), streak, stats, dueCards, verse + `clock`. _AC:_ unit-tested, deterministic via injected clock.
- **T2.3** Repository **ports** + in-memory adapter contract tests. _AC:_ ports defined; in-memory adapter passes contract suite.
- **Checkpoint 2:** domain core high-coverage, zero UI deps.

### Phase 3 — Palaces slice (proves the vertical + real persistence)

- **T3.1** **RxDB adapter** (IndexedDB) implementing the palace/folder ports — source of truth. _AC:_ passes the same contract tests as in-memory (Liskov); persists across reload.
- **T3.2** `entities/palace` store slice + selectors (RxDB-reactive).
- **T3.3** `features/create|edit|delete|duplicate-palace` (commands in the registry).
- **T3.4** `widgets/PalaceList` + `pages/palaces` using `shared/ui` (semantic tokens) + `motion`. _AC:_ full CRUD persists offline; responsive. _Verify:_ Playwright flow.
- **Checkpoint 3:** one slice fully vertical + offline — the template for all slices.

### Phases 4–8 — Remaining slices (same pattern; decompose at each checkpoint)

- **Phase 4 — Palace detail + rooms** (`entities/room`, room CRUD/reorder features, `widgets/RoomJourneyMap`, `pages/palace-detail`; swipe via `@use-gesture`).
- **Phase 5 — Room content** (`entities/locus`,`question`; loci/questions editor widget) + **import/export** (`features/import-content`,`export-content`; anki/csv/json strategies).
- **Phase 6 — Training + Daily Review** (`widgets/StudySession` State machine + `features/review-card`,`grade-card`; `pages/room-train`,`review`).
- **Phase 7 — Quiz + Match + Verse** (State machines; features + widgets + pages).
- **Phase 8 — Progress/XP/streak/stats + notifications + profile/settings** (`entities/progress`,`user`,`preferences`; `widgets/StreakCalendar`,`NotificationsPanel`; EventBus → toasts).
- **Checkpoint after each:** typecheck/tests/boundaries green; slice works offline end-to-end; every mutation registered as a command (tutor inherits it later).

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

### Phase 12 — Dark theme

- **T12.1** Author the dark semantic map; no component edits. _AC:_ toggle + `prefers-color-scheme` re-theme everything; WCAG AA in dark.
- **T12.2** Theme toggle in settings (light/dark/system), persisted + synced.
- **Checkpoint 12:** full light/dark parity, zero hardcoded colors.

### Phase 13 — AI Tutor (the very last phase)

- **T13.1** Command registry consolidation — every mutation is a typed, zod-schema'd command (single source of intents).
- **T13.2** **Permission proxy** — tutor commands require explicit confirmation (role.md).
- **T13.3** **Claude Edge Function** (JWT-verified, per-user rate-limit + token budget) calls Claude with **tool use** (commands as tools, user-scoped; streaming). Latest models (e.g. `claude-opus-4-8`/`claude-sonnet-4-6`). _Verify:_ "create a palace called X" end-to-end behind the gate.
- **T13.4** `widgets/TutorChat` + `pages/tutor` + tutor store (turn State machine).
- **Checkpoint 13:** tutor drives create/edit/search/generate, every action gated, via the Edge Function.

---

## Risks and mitigations

| Risk                                              | Impact | Mitigation                                                                                                   |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| Full rewrite scope                                | High   | Domain core first (Ph 1–2); slice-by-slice views; app runnable from Ph 1                                     |
| Nested separate repo confusion                    | Low    | **Resolved** — relocated to a top-level sibling `web/memory-palaces/` (no longer nested under the old repo). |
| iOS PWA limits (eviction, install, push pre-16.4) | Med    | persisted-storage + cloud safety-net; custom A2HS; push gated to installed/16.4+                             |
| Sync conflicts / lost reviews                     | Med    | append-only merge + per-doc revisions + server-time                                                          |
| LLM key exposure / cost                           | High   | Key only in Edge Function; JWT + rate-limit + token budget                                                   |
| FSD over-ceremony                                 | Low    | Lint-enforced but pragmatic; `shared` for anything cross-cutting                                             |

## Resolved decisions (previously open)

1. **Router → TanStack Router** (typed, lazy routes).
2. **Hosting → Vercel** (+ Supabase backend); PR preview deploys via Vercel.
3. **Sync granularity → RxDB per-document replication** (not JSON-blob backup).

## Deliverables (created on approval)

1. `docs/ai_docs/NEW_ARCHITECHTURE.md` _(current repo — the path you requested + already open)_ — the architecture.
2. New repo `memory-palaces/`: `docs/DESIGN_SYSTEM.md` (Phase 0), `tasks/plan.md`, `tasks/todo.md` (Phases 0–13), and the app code.

Implementation proceeds slice-by-slice (e.g. via `/build`) starting at **Phase 0** — no UI before the design system exists.

## End-to-end verification

- `tsc --noEmit` clean; `lint` (incl. FSD boundaries) clean; `vitest` green; `vite build` succeeds; Lighthouse = installable PWA; app works **offline** and persists across reload.
- Per-slice flows pass in the browser (Playwright E2E for key paths, including offline).
- Phase 9: edits sync across two clients and survive an offline close (Background Sync).
- Final: deployed PWA installs to a phone home screen; AI Tutor performs a gated action via the Edge Function.
