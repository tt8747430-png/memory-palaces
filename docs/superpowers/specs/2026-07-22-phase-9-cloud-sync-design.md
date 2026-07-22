# Phase 9 — Cloud + always-on sync (Supabase) — Design

**Status:** Draft for review
**Date:** 2026-07-22
**Source plan:** `docs/NEW_ARCHITECHTURE.md` → Phase 9 (T9.1–T9.6)

---

## 1. Goal & shape

Give Mindscape real cloud accounts and always-on cross-device sync **without touching
any entity, feature, or domain code** — the whole cloud layer is additive behind the
existing ports (`AuthGateway`, `Repository<T>`) plus two new ports (`SyncManager`,
`StoragePort`), wired only at the composition root.

RxDB (IndexedDB/Dexie) stays the single source of truth on device. The network is
**never** in the read/review path. Everything remains fully usable offline; sync is a
background concern that converges when connectivity returns.

**Decisions locked in (from brainstorming):**

| Fork | Decision |
| --- | --- |
| Auth | Email + password **and** social sign-in (Google + Apple) for sign-up and sign-in |
| Replication | Hand-rolled `replicateRxCollection` + Supabase handlers (only new runtime dep: `@supabase/supabase-js`) |
| Merge | Field-aware: whole-doc LWW for content; counter-merge for `progress` + `card.srs` |
| Postgres mirror | `jsonb` document blob + promoted `user_id / deleted / updated_at` columns (low-drift; PostgREST can still index `data->>'…'`) |
| Local schema | **No RxDB schema migration** — `updatedAt` already exists (LWW clock); `_deleted`/`user_id` live only in the mapping layer |
| Env gating | Supabase adapters activate only when `VITE_SUPABASE_URL` is set; otherwise the app falls back to `LocalAuthGateway` + no sync (offline dev + tests unchanged) |

## 2. Non-goals (explicit scope boundaries)

- **No event-sourced review log.** Field-aware counter-merge is the Phase 9 conflict
  strategy; a full append-only review event stream is deferred to a later phase.
- **No REST CRUD for core domain data.** Domain data flows through replication only, per
  `NEW_ARCHITECHTURE.md`. PostgREST stays available for admin/debug, not the app path.
- **No Web Push / reminders** (that is Phase 10).
- **No AI Tutor / Edge Functions** (Phase 13).
- **No provider-side OAuth credential setup** in code — documented as a prerequisite (§10).

## 3. Which entities sync

| Entity | Syncs? | Notes |
| --- | --- | --- |
| `deck`, `card`, `folder`, `question` | ✅ | Content; whole-doc LWW |
| `profile` | ✅ | One row per user; whole-doc LWW |
| `preferences` | ✅ | One row per user; whole-doc LWW |
| `progress` | ✅ | Counter-merge (xp, streaks, quiz accuracy) |
| `notification` | ❌ | Ephemeral local UI state — stays device-local |
| `session` | ❌ | In-memory only (already non-persisted) |

`card.srs` is a nested object inside `card`; its merge is handled by the `card`
conflict handler (counter/recency merge on the `srs` sub-object), not a separate table.

## 4. T9.1 — Postgres schema + RLS (`supabase/migrations/`)

Local-first CLI workflow: `supabase init` → `supabase/config.toml` + timestamped
migration files under `supabase/migrations/`, applied to a local stack / dev branch
first, then to the remote deliberately.

**Per synced entity, one table** (`decks, cards, folders, questions, progress,
preferences, profiles`), all sharing the same shape:

```sql
create table public.decks (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  data        jsonb not null,          -- the full RxDB document
  deleted     boolean not null default false,
  updated_at  timestamptz not null default now()  -- server clock; drives pull checkpoint
);
alter table public.decks enable row level security;
create index decks_user_updated_idx on public.decks (user_id, updated_at, id);
```

- **`updated_at` is server-authoritative** — a `before insert or update` trigger forces
  `new.updated_at = now()`, ignoring any client value, so the pull checkpoint is
  monotonic. The client's own `data->>'updatedAt'` is a *separate* clock used only by the
  conflict handler.
- **RLS** (identical on every table):
  ```sql
  create policy "own rows read"   on public.decks for select using (user_id = auth.uid());
  create policy "own rows insert" on public.decks for insert with check (user_id = auth.uid());
  create policy "own rows update" on public.decks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  create policy "own rows delete" on public.decks for delete using (user_id = auth.uid());
  ```
  (Deletes are soft — `deleted = true` — so the `delete` policy is defensive.)
- **Realtime**: `alter publication supabase_realtime add table public.decks, …;` Realtime
  respects RLS on the authenticated channel, so each client streams only its own rows.
- One shared `set_updated_at()` trigger function reused across all tables (DRY).
- Migration files: `NNNN_phase9_tables.sql`, `NNNN_phase9_rls.sql`,
  `NNNN_phase9_realtime.sql`, `NNNN_phase9_storage.sql` (§8) — split for reviewability.

## 5. T9.2 — Auth (email/password + Google + Apple)

**Port change** (`shared/api/auth-gateway.ts`) — the current port is email-only and
`getPersisted()` is synchronous; Supabase session restore is async and event-driven, so:

```ts
export type AuthProvider = 'google' | 'apple'

export interface SignUpInput { email: string; name: string; password: string }
export interface SignInInput { email: string; password: string }

export interface AuthGateway {
  signUp(input: SignUpInput): Promise<PersistedAuth>
  signIn(input: SignInInput): Promise<PersistedAuth>
  signInWithProvider(provider: AuthProvider): Promise<void>   // redirect-based
  persistGuest(): Promise<PersistedAuth>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>          // now real
  getCurrent(): Promise<PersistedAuth | null>                 // was getPersisted()
  onAuthChange(cb: (auth: PersistedAuth | null) => void): Unsubscribe
}
```

- **Adapter** `shared/api/supabase/supabase-auth-gateway.ts` implements it via
  `signUp` / `signInWithPassword` /
  `signInWithOAuth({ provider, options:{ redirectTo: ${origin}/auth/callback } })` /
  `resetPasswordForEmail` / `getSession` / `onAuthStateChange`.
- **`LocalAuthGateway` updated** to the new port (password ignored; `signInWithProvider`
  throws "not available offline"; `getCurrent`/`onAuthChange` over localStorage) so tests
  and offline dev keep working.
- **`features/session/restore-session.ts`** switches from a one-shot read to subscribing
  via `onAuthChange` (initial `getCurrent()` + live updates), keeping the session store in
  sync with token refresh and OAuth return.
- **OAuth callback (PKCE)**: per the Supabase Google/Apple docs, both providers use the
  **PKCE authorization-code flow** on web. New route `/auth/callback` (`pages/auth-callback`):
  the browser `supabase-js` client (`flowType: 'pkce'`, `detectSessionInUrl: true`)
  auto-exchanges the `?code=` for a session on load; the page awaits the first `onAuthChange`
  with a session (explicit `exchangeCodeForSession(code)` fallback on the error path), then
  redirects home. Errors render inline retry, not a dead end.
- **Apple name caveat**: Apple's web OAuth **does not return the user's name**. Apple
  sign-ups land with an empty `name`; the profile onboarding lets them set it (default to the
  email local-part) rather than blocking.
- **UI** (auth pages already exist — `pages/login`, `pages/signup`, `pages/forgot-password`,
  `pages/settings-change-password`, `shared/ui/AuthScreen.tsx`, `shared/ui/AuthField.tsx`):
  wire the existing email/password fields to real Supabase auth, make "Forgot password?"
  real, and **add** "Continue with Google" / "Continue with Apple" buttons. New copy →
  `shared/i18n/locales/en.ts`. Handle loading / error / offline states (offline: disable
  social + show "You're offline").

## 6. T9.3 — Replication (`shared/api/supabase/`)

Per synced collection, `replicateRxCollection`:

- **`push.handler(rows)`** → map each RxDB doc to `{ id, user_id: <uid>, data, deleted: doc._deleted, }`
  and `supabase.from(table).upsert(payload, { onConflict: 'id' })`. Returns server-side
  conflicts as RxDB "error documents" so RxDB re-runs the conflict handler.
- **`pull.handler(checkpoint, batchSize)`** → `supabase.from(table)
  .select('id,data,deleted,updated_at')
  .gt('updated_at', checkpoint?.updated_at ?? epoch)
  .order('updated_at').order('id').limit(batchSize)`; map `deleted → _deleted`; return
  `{ documents, checkpoint: { updated_at, id } of last row }`.
- **`pull.stream$`** → a Supabase Realtime `postgres_changes` channel per table, mapped to
  RxDB pull events (`{ documents, checkpoint }`); reconnect emits the `RESYNC` flag so RxDB
  re-pulls from the last checkpoint after any gap.
- **`deletedField`** → mapping layer bridges RxDB `_deleted` ↔ Postgres `deleted`.
- **Conflict handling** (`entities/*/model` collections gain a `conflictHandler` at DB
  creation in `app/persistence/database.ts`):
  - Content (`deck`, `folder`, `question`, `profile`, `preferences`): whole-doc LWW by
    `data.updatedAt`.
  - `progress`: merge — `max` of monotonic counters (`xp`, `streakCount`, `longestStreak`,
    `streakFreezes`, `bestQuizAccuracy`, `activeDayCount`), union of `trainingDays`, newest
    `lastTrainingDate`/`activeDayKey`.
  - `card`: LWW on content fields; `srs` sub-object merges — newest `due`/`lastReviewed`,
    `max(reps)`, `max(lapses)`, ease/interval follow the newest `lastReviewed`.
  - Merge functions live as pure, unit-tested helpers in `shared/lib` (e.g. `merge-progress.ts`,
    `merge-srs.ts`) so the conflict handlers stay thin and the logic is testable in isolation.

A small **mapping module** (`shared/api/supabase/document-mapping.ts`) owns doc↔row
translation in one place (single source of truth, no per-handler drift).

## 7. T9.4 — Sync-on-leave & durability

- **`SyncManager`** (`shared/api/supabase/sync-manager.ts`), a composition-root singleton,
  owns every `RxReplicationState`. Exposes `start()`, `stop()`, `flush()`, `isInSync()`.
- **Flush on leave**: `document.addEventListener('visibilitychange', …)` (hidden) and
  `pagehide` → `flush()` (trigger `reSync()` + await in-sync, best-effort within the
  event budget).
- **Durability**: `navigator.storage.persist()` requested at startup (guards against
  eviction of the RxDB store).
- **Background Sync**: Workbox `BackgroundSyncPlugin` registered in the service worker
  (`vite.config.ts` Workbox config) for the Supabase REST push endpoints, so writes queued
  while offline/closing replay after the tab dies. RxDB's own retry covers the live case;
  Background Sync is the belt-and-suspenders for the final flush.

## 8. T9.5 — Storage (`StoragePort`)

- **Port** `shared/api/storage-port.ts`: `upload(input): Promise<{ url }>`,
  `remove(path)`. Supabase adapter (`supabase.storage.from(bucket)`) + a no-op/local
  adapter for tests/offline.
- **Buckets** `deck-images`, `avatars`; object path `${userId}/${id}`; `storage.objects`
  RLS scoping read/write to the caller's `userId` prefix (migration `NNNN_phase9_storage.sql`).
- **Offline-graceful**: on image set, keep the local blob (object URL) and enqueue the
  upload; the deck/profile row syncs immediately with the local reference, and the stored
  URL is patched in once the upload succeeds (retried via Background Sync). Deck/profile
  `image`/`avatar` fields hold the storage path/URL.

## 9. T9.6 — Guest → account claim

Guest data already lives in local RxDB, so claim is mostly automatic:

- On the **first successful sign-up/social sign-in while in guest mode**, a
  `features/auth/claim-guest-data.ts` command starts replication for the new identity;
  RxDB's push sends all local docs (stamped with `user_id` at push) into the fresh account.
- **Second device**: pull rehydrates from the server — verified by the
  guest → signup → second-device test.
- **Existing account with server data**: pull + push converge via the conflict handlers
  (LWW / counter-merge), so nothing is lost.
- **User switch on one device** (sign out → sign in as a *different* user): reset the local
  RxDB database, then pull rehydrates the new user's data. The local DB name is namespaced
  so a returning same-user session reuses its store. (Guest namespace migrates into the
  account namespace on claim.)

## 10. Environment & external prerequisites

- **Client singleton** `shared/api/supabase/client.ts` from `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_PUBLISHABLE_KEY` — the modern **publishable key** (`sb_publishable_…`) that
  replaced the legacy "anon key". (Legacy anon JWTs still work but coexist; we use the
  publishable key per zero-legacy. The server `sb_secret_…` key is never shipped to the
  client.) Add `.env.example`; real values in `.env.local` (gitignored). URL/key come from
  the Supabase project (`get_project_url` / `get_publishable_keys` or Dashboard → Project
  Settings → API Keys).
- **Composition root** picks `SupabaseAuthGateway` + starts `SyncManager` when
  `VITE_SUPABASE_URL` is present; otherwise `LocalAuthGateway` + no sync.
- **Redirect allowlist**: add every app origin's `/auth/callback` (local dev + prod) to
  Supabase Auth → URL Configuration → Redirect URLs. `signInWithProvider` passes
  `redirectTo: ${window.location.origin}/auth/callback`.
- **Provider config (outside code — prerequisite for social login to *function*; the code
  path ships complete and the buttons are inert until these exist):**
  - **Google** (per `auth-google` docs): Google Cloud console → create a **Web application**
    OAuth 2.0 client; **Authorized JavaScript origins** = app domain(s); **Authorized
    redirect URIs** = `https://<ref>.supabase.co/auth/v1/callback`. Paste **Client ID** +
    **Client Secret** into Supabase Auth → Providers → Google.
  - **Apple** (per `auth-apple` docs, web flow): Apple Developer → **App ID** (enable "Sign
    in with Apple") → **Services ID** (e.g. `com.mindscape.app.web`, this is the **Client
    ID**) with Website URLs domain `<ref>.supabase.co` + return
    `https://<ref>.supabase.co/auth/v1/callback` → **Sign in with Apple key** (`.p8`) →
    generate the **client secret** from the `.p8`. Into Supabase Auth → Providers → Apple:
    **Client ID** (Services ID), **Team ID**, **Key ID**, **Secret**.
  - **⚠ Apple secret rotates every 6 months** — keep the `.p8`, set a recurring reminder.
    Document this in `README`/ops notes so social login doesn't silently break later.
  - Email/password + password-reset work with **no** extra provider setup.

## 11. FSD file map (new/changed)

```
supabase/                                  # new: config.toml + migrations/*.sql
src/shared/api/
  auth-gateway.ts                          # changed: widened port
  storage-port.ts                          # new
  supabase/
    client.ts                              # new
    supabase-auth-gateway.ts               # new
    replication.ts                         # new: replicateRxCollection wiring
    document-mapping.ts                    # new: doc <-> row
    sync-manager.ts                        # new
    supabase-storage.ts                    # new
    index.ts                               # new barrel
src/shared/lib/
  merge-progress.ts, merge-srs.ts          # new: pure merge helpers (+ colocated tests)
src/app/
  persistence/database.ts                  # changed: conflictHandlers per collection
  persistence/local-auth-gateway.ts        # changed: new port
  composition-root.ts                      # changed: env-gated adapter + SyncManager
  providers/AuthProvider.tsx               # changed: onAuthChange subscription
  router.tsx                               # changed: /auth/callback route
src/pages/auth-callback/                    # new
src/features/session/restore-session.ts    # changed
src/features/auth/claim-guest-data.ts      # new
src/pages/{login,signup,forgot-password}/  # changed: real auth + social buttons
src/shared/ui/AuthScreen.tsx               # changed: social sign-in slot
src/shared/i18n/locales/en.ts              # changed: auth + sync copy
```

## 12. Testing & verification

- **Unit** (`vitest`, in-memory + fake-indexeddb): `merge-progress`, `merge-srs`,
  `document-mapping`, conflict handlers, `SupabaseAuthGateway` (mocked client),
  `claim-guest-data`.
- **Replication integration** (local Supabase stack or PGlite): two-client convergence,
  offline-queue-then-merge, tombstone propagation, checkpoint resume after reconnect.
- **Security**: RLS deny cross-user read/write; storage path RLS.
- **Guest-claim**: guest → signup → second-device round-trip.
- **Gate**: `npm run typecheck && npm run lint && npm run test` green; no FSD boundary
  violations.

## 13. Checkpoint 9 acceptance

Real accounts (email/password + Google + Apple) + guest-claim + always-on cross-device
sync + image storage — **still fully usable offline**, with the network never in the
read/review path, and no persisted-schema break for existing on-device data.

## 14. Risks / open items

- **Apple/Google provider credentials** are external (§10) — code ships complete; social
  buttons are inert until keys are configured. **Apple's client secret expires every 6
  months** → a standing ops task, not a one-time setup.
- **Field-aware merge is not event sourcing** — rare true-concurrent edits to the same
  counter can still lose a small delta; acceptable for Phase 9, revisited if telemetry shows
  it matters.
- **RxDB 17 `conflictHandler` exact contract** to be confirmed against live docs during the
  red/green of that unit (the LWW pattern is verified; the counter-merge return shape is the
  detail to pin).
- **Suggest a dedicated branch** `feat/phase-9-cloud-sync` (current branch is
  `test/ui-component-suite`, unrelated).
```
