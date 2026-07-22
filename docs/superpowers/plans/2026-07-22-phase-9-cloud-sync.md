# Phase 9 — Cloud + always-on sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real Supabase accounts (email/password + Google + Apple) and always-on, offline-first cross-device sync (RxDB ↔ Supabase) with Storage and guest→account claim — entirely behind existing ports, touching no domain logic.

**Architecture:** RxDB stays the on-device source of truth; the cloud layer is additive behind `AuthGateway`, a new `SyncManager`, and a `StoragePort`, wired only at the composition root. Replication is hand-rolled with `replicateRxCollection` (upsert push / PostgREST+checkpoint pull / Realtime `stream$`). Conflicts resolve field-aware: last-write-wins for content, counter-merge for `progress`/`card.srs`. Adapters are env-gated — with no `VITE_SUPABASE_URL`, the app runs exactly as today (local auth, no sync), keeping every existing test green.

**Tech Stack:** React 19, Vite, TypeScript (strict), RxDB 17 (Dexie), `@supabase/supabase-js` v2 (new dep), Supabase (Postgres + Auth + Realtime + Storage), Vitest + fake-indexeddb, Workbox (vite-plugin-pwa).

**Spec:** `docs/superpowers/specs/2026-07-22-phase-9-cloud-sync-design.md`

## Global Constraints

- **FSD layers (lint-enforced):** `app → pages → widgets → features → entities → shared`; import only from strictly-below layers; cross-slice only via `index.ts` barrels. Path alias `@` → `src`.
- **No RxDB schema migration** — `updatedAt` already exists (LWW clock); `_deleted`/`user_id` live only in the Supabase mapping layer. Do not add required fields to `app/persistence/schemas.ts`.
- **Writes go through feature commands; reads through selectors/hooks; pure logic in `shared/lib` or `entities/*/model`** with colocated `*.test.ts`.
- **TS strict:** `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` + `isolatedModules` → `import type` for type-only imports.
- **i18n:** every user-facing string added to `src/shared/i18n/locales/en.ts` (types augmented in `i18n/i18next.d.ts`).
- **Semantic tokens only** in UI (no raw hex, no per-component `dark:`).
- **Prettier:** no semicolons, single quotes, trailing-comma `all`, printWidth 100. Format only touched files: `npx prettier --write <files>`.
- **Vitest `globals: false`** — import `describe/it/expect/vi` from `vitest`.
- **Gate before "done" per stage:** `npm run typecheck && npm run lint && npm run test`.
- **Env var names (exact):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — the modern `sb_publishable_…` client key that replaced the legacy "anon key". (Legacy anon JWTs still work but coexist; we use the publishable key per this repo's zero-legacy rule. The server-side `sb_secret_…` key is never shipped to the client.)
- **Domain data never served by REST CRUD** — replication only; PostgREST reserved for admin/debug.
- **Commit style:** end messages with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Work on branch `feat/phase-9-cloud-sync`.

---

## File Structure

**New:**
```
supabase/config.toml                                  # supabase init
supabase/migrations/<ts>_phase9_tables.sql            # 7 mirror tables + set_updated_at trigger
supabase/migrations/<ts>_phase9_rls.sql               # RLS policies (all tables)
supabase/migrations/<ts>_phase9_realtime.sql          # add tables to supabase_realtime publication
supabase/migrations/<ts>_phase9_storage.sql           # buckets + storage.objects policies
.env.example                                          # VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
src/shared/api/supabase/client.ts                     # supabase-js singleton + isSupabaseConfigured()
src/shared/api/supabase/supabase-auth-gateway.ts      # AuthGateway adapter
src/shared/api/supabase/document-mapping.ts           # RxDB doc <-> Postgres row
src/shared/api/supabase/replication.ts                # createCollectionReplication()
src/shared/api/supabase/sync-manager.ts               # SyncManager (owns replication states)
src/shared/api/supabase/supabase-storage.ts           # StoragePort adapter
src/shared/api/supabase/index.ts                      # barrel
src/shared/api/storage-port.ts                        # StoragePort interface + LocalStorageAdapter (noop)
src/shared/lib/merge-progress.ts                      # pure counter-merge (+ test)
src/shared/lib/merge-srs.ts                           # pure srs-merge (+ test)
src/features/auth/claim-guest-data.ts                 # guest -> account command (+ test)
src/features/auth/index.ts                            # barrel
src/pages/auth-callback/ui/AuthCallbackPage.tsx       # OAuth PKCE landing (+ test)
src/pages/auth-callback/index.ts                      # barrel
```
**Modified:**
```
package.json                                          # + @supabase/supabase-js
src/shared/api/auth-gateway.ts                        # widened port
src/shared/api/index.ts                               # export storage-port, supabase barrel bits
src/app/persistence/local-auth-gateway.ts             # implement widened port (+ its test)
src/app/persistence/database.ts                       # per-collection conflictHandler; user-namespaced db name
src/app/composition-root.ts                           # env-gated auth adapter + SyncManager + StoragePort
src/app/providers/AuthProvider.tsx                    # subscribe via onAuthChange
src/app/router.tsx                                    # + /auth/callback route
src/features/session/restore-session.ts               # onAuthChange subscription (+ test)
src/pages/login/ui/LoginPage.tsx                      # real auth + social buttons
src/pages/signup/ui/SignupPage.tsx                    # real auth + social buttons
src/pages/forgot-password/...                         # real resetPasswordForEmail
src/shared/ui/AuthScreen.tsx                          # social sign-in slot
src/shared/i18n/locales/en.ts                         # auth + sync copy
vite.config.ts                                        # Workbox BackgroundSync for Supabase push
```

---

## STAGE 0 — Setup & Supabase foundation (T9.1)

### Task 0.1: Supabase dependency, client singleton, env gating

**Files:**
- Modify: `package.json` (add dependency)
- Create: `.env.example`, `src/shared/api/supabase/client.ts`, `src/shared/api/supabase/index.ts`
- Modify: `src/shared/api/index.ts`
- Test: `src/shared/api/supabase/client.test.ts`

**Interfaces:**
- Produces: `supabase` (a `SupabaseClient`), `isSupabaseConfigured(): boolean`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` from `@/shared/api/supabase`.

- [ ] **Step 1: Install the dependency**

Run: `npm install @supabase/supabase-js`
Expected: `@supabase/supabase-js` appears under `dependencies` in `package.json`.

- [ ] **Step 2: Add `.env.example`**

```
# Supabase (leave unset to run fully offline with local auth + no sync)
# Project URL + publishable key: Dashboard → Project Settings → API Keys
# (the sb_publishable_... key — the modern replacement for the legacy "anon" key)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

- [ ] **Step 3: Write the failing test**

`src/shared/api/supabase/client.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { isSupabaseConfigured } from './client'

describe('isSupabaseConfigured', () => {
  it('is false when env vars are absent', () => {
    // vitest env has no VITE_SUPABASE_URL set
    expect(isSupabaseConfigured()).toBe(false)
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/shared/api/supabase/client.test.ts`
Expected: FAIL — `Cannot find module './client'`.

- [ ] **Step 5: Implement the client**

`src/shared/api/supabase/client.ts`:
```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

export const isSupabaseConfigured = (): boolean =>
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_PUBLISHABLE_KEY)

// Single shared client. PKCE is required for the Google/Apple web OAuth flows;
// detectSessionInUrl auto-exchanges the ?code= on the /auth/callback landing.
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'http://localhost',
  SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_placeholder',
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
```

- [ ] **Step 6: Barrel it**

`src/shared/api/supabase/index.ts`:
```ts
export { supabase, isSupabaseConfigured, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './client'
```
Add `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` to the `ImportMetaEnv` interface in `src/vite-env.d.ts` (create the interface if absent):
```ts
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}
```

- [ ] **Step 7: Run test + typecheck**

Run: `npx vitest run src/shared/api/supabase/client.test.ts && npm run typecheck`
Expected: PASS; no type errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .env.example src/shared/api/supabase src/shared/api/index.ts src/vite-env.d.ts
git commit -m "feat(sync): add supabase client singleton and env gating"
```

### Task 0.2: Postgres mirror tables + server-clock trigger (migration)

**Files:**
- Create: `supabase/config.toml` (via `supabase init`), `supabase/migrations/<ts>_phase9_tables.sql`
- Test: `supabase/tests/phase9_tables.sql` (pgTAP) — or the manual SQL assertion in Step 3.

**Interfaces:**
- Produces: tables `public.{decks,cards,folders,questions,progress,preferences,profiles}` each `(id uuid pk, user_id uuid, data jsonb, deleted bool, updated_at timestamptz)`; trigger `set_updated_at`.

- [ ] **Step 1: Initialize Supabase locally**

Run: `npx supabase init` (creates `supabase/config.toml`). If Docker is available, `npx supabase start`.
Fallback (no Docker): apply migrations to a dev branch via the Supabase MCP `apply_migration`, and run assertions via `execute_sql`.

- [ ] **Step 2: Write the migration**

`supabase/migrations/<ts>_phase9_tables.sql`:
```sql
-- Shared server-clock trigger: forces updated_at = now() on every write so the
-- replication pull checkpoint is monotonic and client clocks can't skew it.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['decks','cards','folders','questions','progress','preferences','profiles']
  loop
    execute format($f$
      create table if not exists public.%I (
        id         uuid primary key,
        user_id    uuid not null default auth.uid() references auth.users on delete cascade,
        data       jsonb not null,
        deleted    boolean not null default false,
        updated_at timestamptz not null default now()
      );
      create index if not exists %I on public.%I (user_id, updated_at, id);
      drop trigger if exists set_updated_at on public.%I;
      create trigger set_updated_at before insert or update on public.%I
        for each row execute function public.set_updated_at();
    $f$, t, t || '_user_updated_idx', t, t, t);
  end loop;
end $$;
```

- [ ] **Step 3: Verify the migration applies**

Run (local stack): `npx supabase db reset`
Then assert (psql via `npx supabase db execute` or MCP `execute_sql`):
```sql
select count(*) from information_schema.tables
where table_schema = 'public'
  and table_name in ('decks','cards','folders','questions','progress','preferences','profiles');
```
Expected: `7`.

- [ ] **Step 4: Commit**

```bash
git add supabase/config.toml supabase/migrations
git commit -m "feat(sync): postgres mirror tables + server-clock trigger"
```

### Task 0.3: RLS + Realtime migrations

**Files:**
- Create: `supabase/migrations/<ts>_phase9_rls.sql`, `supabase/migrations/<ts>_phase9_realtime.sql`

**Interfaces:**
- Produces: per-user RLS on all 7 tables; all 7 tables in the `supabase_realtime` publication.

- [ ] **Step 1: Write the RLS migration**

`supabase/migrations/<ts>_phase9_rls.sql`:
```sql
do $$
declare t text;
begin
  foreach t in array array['decks','cards','folders','questions','progress','preferences','profiles']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($p$create policy "own_select" on public.%I for select using (user_id = auth.uid());$p$, t);
    execute format($p$create policy "own_insert" on public.%I for insert with check (user_id = auth.uid());$p$, t);
    execute format($p$create policy "own_update" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid());$p$, t);
    execute format($p$create policy "own_delete" on public.%I for delete using (user_id = auth.uid());$p$, t);
  end loop;
end $$;
```

- [ ] **Step 2: Write the Realtime migration**

`supabase/migrations/<ts>_phase9_realtime.sql`:
```sql
alter publication supabase_realtime add table
  public.decks, public.cards, public.folders, public.questions,
  public.progress, public.preferences, public.profiles;
```

- [ ] **Step 3: Verify RLS denies cross-user access**

Run `npx supabase db reset`, then via `execute_sql` (as an authenticated role for user A) attempt to select user B's rows.
Expected: 0 rows returned (deny). And `select count(*) from pg_policies where schemaname='public'` ≥ `28` (4 × 7).

- [ ] **Step 4: Run advisors (security check)**

Use Supabase MCP `get_advisors` (type: security).
Expected: no "RLS disabled" findings for the 7 tables.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat(sync): per-user RLS + realtime publication for mirror tables"
```

---

## STAGE 1 — Auth: email/password + Google + Apple (T9.2)

### Task 1.1: Widen the AuthGateway port + update LocalAuthGateway

**Files:**
- Modify: `src/shared/api/auth-gateway.ts`
- Modify: `src/app/persistence/local-auth-gateway.ts`
- Test: `src/app/persistence/local-auth-gateway.test.ts` (update existing)

**Interfaces:**
- Produces: widened `AuthGateway` with `signUp/signIn(+password)`, `signInWithProvider('google'|'apple')`, real `requestPasswordReset`, async `getCurrent()`, `onAuthChange(cb)`.
- Consumes: `Unsubscribe` from `@/shared/api/base-repository`.

- [ ] **Step 1: Update the port**

`src/shared/api/auth-gateway.ts` (full file):
```ts
import type { Unsubscribe } from './base-repository'

export type AuthKind = 'guest' | 'account'
export type AuthProvider = 'google' | 'apple'

export interface PersistedAuth {
  id: string
  kind: AuthKind
  email?: string
  name?: string
}

export interface SignUpInput {
  email: string
  name: string
  password: string
}

export interface SignInInput {
  email: string
  password: string
}

export interface AuthGateway {
  signUp(input: SignUpInput): Promise<PersistedAuth>
  signIn(input: SignInInput): Promise<PersistedAuth>
  signInWithProvider(provider: AuthProvider): Promise<void>
  persistGuest(): Promise<PersistedAuth>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  getCurrent(): Promise<PersistedAuth | null>
  onAuthChange(cb: (auth: PersistedAuth | null) => void): Unsubscribe
}
```
Confirm `Unsubscribe` is exported from `src/shared/api/index.ts` (it is, via `base-repository`).

- [ ] **Step 2: Update the failing test for LocalAuthGateway**

In `src/app/persistence/local-auth-gateway.test.ts`, adapt existing cases to the new signatures and add:
```ts
it('exposes the persisted auth via async getCurrent', async () => {
  const gateway = new LocalAuthGateway(() => 'fixed-id')
  await gateway.signUp({ email: 'a@b.co', name: 'A', password: 'x' })
  await expect(gateway.getCurrent()).resolves.toMatchObject({ id: 'fixed-id', kind: 'account' })
})

it('notifies subscribers on sign-out', async () => {
  const gateway = new LocalAuthGateway(() => 'fixed-id')
  const seen: (string | null)[] = []
  gateway.onAuthChange((a) => seen.push(a?.kind ?? null))
  await gateway.persistGuest()
  await gateway.signOut()
  expect(seen).toContain(null)
})

it('rejects social sign-in when offline-only', async () => {
  const gateway = new LocalAuthGateway()
  await expect(gateway.signInWithProvider('google')).rejects.toThrow()
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/app/persistence/local-auth-gateway.test.ts`
Expected: FAIL — `getCurrent`/`onAuthChange`/`signInWithProvider` not defined.

- [ ] **Step 4: Implement the widened LocalAuthGateway**

`src/app/persistence/local-auth-gateway.ts` (full file):
```ts
import type {
  AuthGateway,
  AuthProvider,
  PersistedAuth,
  SignInInput,
  SignUpInput,
  Unsubscribe,
} from '@/shared/api'

const STORAGE_KEY = 'mindscape:auth'

export class LocalAuthGateway implements AuthGateway {
  private readonly listeners = new Set<(auth: PersistedAuth | null) => void>()

  constructor(private readonly genId: () => string = () => crypto.randomUUID()) {}

  async signUp(input: SignUpInput): Promise<PersistedAuth> {
    return this.write({ id: this.genId(), kind: 'account', email: input.email, name: input.name })
  }

  async signIn(input: SignInInput): Promise<PersistedAuth> {
    return this.write({ id: this.genId(), kind: 'account', email: input.email, name: '' })
  }

  async signInWithProvider(_provider: AuthProvider): Promise<void> {
    throw new Error('Social sign-in requires a cloud connection')
  }

  async persistGuest(): Promise<PersistedAuth> {
    const prior = this.getPersisted()
    if (prior?.kind === 'guest') return prior
    return this.write({ id: this.genId(), kind: 'guest' })
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
    this.emit(null)
  }

  async requestPasswordReset(_email: string): Promise<void> {}

  async getCurrent(): Promise<PersistedAuth | null> {
    return this.getPersisted()
  }

  onAuthChange(cb: (auth: PersistedAuth | null) => void): Unsubscribe {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private getPersisted(): PersistedAuth | null {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as PersistedAuth
      return parsed.id && (parsed.kind === 'guest' || parsed.kind === 'account') ? parsed : null
    } catch {
      return null
    }
  }

  private write(auth: PersistedAuth): PersistedAuth {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    this.emit(auth)
    return auth
  }

  private emit(auth: PersistedAuth | null): void {
    for (const cb of this.listeners) cb(auth)
  }
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/app/persistence/local-auth-gateway.test.ts && npm run typecheck`
Expected: PASS (typecheck will surface every caller of the old port — fix call sites in Tasks 1.3/1.5; if the build is red here, that is expected until those tasks land, so run only the targeted test + `tsc` on this file's islands is not possible — instead proceed and keep the vitest file green).

- [ ] **Step 6: Commit**

```bash
git add src/shared/api/auth-gateway.ts src/app/persistence/local-auth-gateway.ts src/app/persistence/local-auth-gateway.test.ts
git commit -m "feat(auth): widen AuthGateway port (password, social, async session)"
```

### Task 1.2: SupabaseAuthGateway adapter

**Files:**
- Create: `src/shared/api/supabase/supabase-auth-gateway.ts`
- Modify: `src/shared/api/supabase/index.ts`
- Test: `src/shared/api/supabase/supabase-auth-gateway.test.ts`

**Interfaces:**
- Consumes: `supabase` client, `AuthGateway`, `PersistedAuth`, `AuthProvider`, `SignInInput`, `SignUpInput`.
- Produces: `class SupabaseAuthGateway implements AuthGateway`.

- [ ] **Step 1: Write the failing test (mocked client)**

`src/shared/api/supabase/supabase-auth-gateway.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'
import { SupabaseAuthGateway } from './supabase-auth-gateway'

const makeClient = () => ({
  auth: {
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.co', user_metadata: { name: 'Ada' } } },
      error: null,
    }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: 'https://x' }, error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
})

describe('SupabaseAuthGateway', () => {
  it('maps a signed-in user to PersistedAuth', async () => {
    const client = makeClient()
    const gateway = new SupabaseAuthGateway(client as never, () => 'guest-1')
    const auth = await gateway.signIn({ email: 'a@b.co', password: 'pw' })
    expect(auth).toEqual({ id: 'u1', kind: 'account', email: 'a@b.co', name: 'Ada' })
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.co', password: 'pw' })
  })

  it('starts the provider redirect with the callback URL', async () => {
    const client = makeClient()
    const gateway = new SupabaseAuthGateway(client as never, () => 'guest-1')
    await gateway.signInWithProvider('apple')
    expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  })

  it('throws the supabase error message on failed sign-in', async () => {
    const client = makeClient()
    client.auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'bad creds' } })
    const gateway = new SupabaseAuthGateway(client as never, () => 'guest-1')
    await expect(gateway.signIn({ email: 'a@b.co', password: 'x' })).rejects.toThrow('bad creds')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shared/api/supabase/supabase-auth-gateway.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the adapter**

`src/shared/api/supabase/supabase-auth-gateway.ts`:
```ts
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type {
  AuthGateway,
  AuthProvider,
  PersistedAuth,
  SignInInput,
  SignUpInput,
  Unsubscribe,
} from '@/shared/api'

const GUEST_KEY = 'mindscape:guest'

const toAuth = (user: User): PersistedAuth => ({
  id: user.id,
  kind: 'account',
  email: user.email ?? undefined,
  name: (user.user_metadata?.name as string | undefined) ?? '',
})

export class SupabaseAuthGateway implements AuthGateway {
  constructor(
    private readonly client: SupabaseClient,
    private readonly genId: () => string = () => crypto.randomUUID(),
  ) {}

  async signUp(input: SignUpInput): Promise<PersistedAuth> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name } },
    })
    if (error) throw new Error(error.message)
    // With email confirmation on, session is null until confirmed; the user still exists.
    if (!data.user) throw new Error('Sign-up failed')
    return toAuth(data.user)
  }

  async signIn(input: SignInInput): Promise<PersistedAuth> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Sign-in failed')
    return toAuth(data.user)
  }

  async signInWithProvider(provider: AuthProvider): Promise<void> {
    const { error } = await this.client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw new Error(error.message)
  }

  async persistGuest(): Promise<PersistedAuth> {
    const raw = localStorage.getItem(GUEST_KEY)
    if (raw) return JSON.parse(raw) as PersistedAuth
    const guest: PersistedAuth = { id: this.genId(), kind: 'guest' }
    localStorage.setItem(GUEST_KEY, JSON.stringify(guest))
    return guest
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut()
    if (error) throw new Error(error.message)
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) throw new Error(error.message)
  }

  async getCurrent(): Promise<PersistedAuth | null> {
    const { data } = await this.client.auth.getSession()
    if (data.session?.user) return toAuth(data.session.user)
    const raw = localStorage.getItem(GUEST_KEY)
    return raw ? (JSON.parse(raw) as PersistedAuth) : null
  }

  onAuthChange(cb: (auth: PersistedAuth | null) => void): Unsubscribe {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      cb(session?.user ? toAuth(session.user) : null)
    })
    return () => data.subscription.unsubscribe()
  }
}
```

- [ ] **Step 4: Run test + barrel export**

Add to `src/shared/api/supabase/index.ts`:
```ts
export { SupabaseAuthGateway } from './supabase-auth-gateway'
```
Run: `npx vitest run src/shared/api/supabase/supabase-auth-gateway.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/api/supabase
git commit -m "feat(auth): SupabaseAuthGateway adapter (password, oauth, reset, session)"
```

### Task 1.3: restore-session via onAuthChange + AuthProvider

**Files:**
- Modify: `src/features/session/restore-session.ts`
- Modify: `src/app/providers/AuthProvider.tsx`
- Test: `src/features/session/restore-session.test.ts` (update/create)

**Interfaces:**
- Consumes: `AuthGateway.getCurrent`, `AuthGateway.onAuthChange`; the session store.
- Produces: `restoreSession({ gateway, sessionStore })` now returns an `Unsubscribe`.

- [ ] **Step 1: Write the failing test**

`src/features/session/restore-session.test.ts` (key case):
```ts
import { describe, expect, it, vi } from 'vitest'
import { restoreSession } from './restore-session'

it('pushes auth changes into the session store', async () => {
  let handler: (a: unknown) => void = () => {}
  const gateway = {
    getCurrent: vi.fn().mockResolvedValue(null),
    onAuthChange: vi.fn((cb: (a: unknown) => void) => {
      handler = cb
      return () => {}
    }),
  }
  const setAuth = vi.fn()
  const sessionStore = { getState: () => ({ setAuth }) }
  await restoreSession({ gateway: gateway as never, sessionStore: sessionStore as never })
  handler({ id: 'u1', kind: 'account' })
  expect(setAuth).toHaveBeenCalledWith({ id: 'u1', kind: 'account' })
})
```
(Adjust `setAuth` to the session store's actual mutation — inspect `entities/session/model` and match its real API; if the store uses a different setter name, use that verbatim.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/features/session/restore-session.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`src/features/session/restore-session.ts` — read current implementation, then rewrite to:
```ts
import type { AuthGateway } from '@/shared/api'
import type { SessionStore } from '@/entities/session'

interface Deps {
  gateway: AuthGateway
  sessionStore: SessionStore
}

export async function restoreSession({ gateway, sessionStore }: Deps): Promise<() => void> {
  const apply = (auth: Awaited<ReturnType<AuthGateway['getCurrent']>>) => {
    // Use the session store's real mutation for setting/clearing the current auth.
    sessionStore.getState().setAuth(auth)
  }
  apply(await gateway.getCurrent())
  return gateway.onAuthChange(apply)
}
```
(Replace `setAuth` with the session store's actual method discovered in Step 1.)

- [ ] **Step 4: Update AuthProvider to keep the subscription**

`src/app/providers/AuthProvider.tsx`:
```tsx
import { type ReactNode, useEffect } from 'react'
import { useAuthGateway } from '@/shared/lib'
import { useSessionStoreApi } from '@/entities/session'
import { restoreSession } from '@/features/session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const gateway = useAuthGateway()
  const sessionStore = useSessionStoreApi()

  useEffect(() => {
    let unsub = () => {}
    let active = true
    void restoreSession({ gateway, sessionStore }).then((u) => {
      if (active) unsub = u
      else u()
    })
    return () => {
      active = false
      unsub()
    }
  }, [gateway, sessionStore])

  return children
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/features/session && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/session/restore-session.ts src/features/session/restore-session.test.ts src/app/providers/AuthProvider.tsx
git commit -m "feat(auth): restore session reactively via onAuthChange"
```

### Task 1.4: /auth/callback page + route

**Files:**
- Create: `src/pages/auth-callback/ui/AuthCallbackPage.tsx`, `src/pages/auth-callback/index.ts`
- Modify: `src/app/router.tsx`
- Test: `src/pages/auth-callback/ui/AuthCallbackPage.test.tsx`

**Interfaces:**
- Consumes: `supabase` (for the explicit-exchange fallback), `useAuthGateway().onAuthChange`, router navigation.
- Produces: route `/auth/callback` rendering `AuthCallbackPage`.

- [ ] **Step 1: Write the failing test**

`src/pages/auth-callback/ui/AuthCallbackPage.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthCallbackPage } from './AuthCallbackPage'

vi.mock('@/shared/api/supabase', () => ({
  supabase: { auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) } },
}))

it('shows a signing-in state while resolving the session', () => {
  render(<AuthCallbackPage onDone={vi.fn()} onError={vi.fn()} sessionReady={false} />)
  expect(screen.getByText(/signing you in/i)).toBeInTheDocument()
})
```
(Follow the repo's existing page-test pattern — check an existing `*Page.test.tsx` for the render helper/providers used, e.g. `renderWithProviders`, and reuse it. The component is written to accept injectable props so it is trivially testable.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/pages/auth-callback`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the page**

`src/pages/auth-callback/ui/AuthCallbackPage.tsx`:
```tsx
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/shared/api/supabase'

interface Props {
  sessionReady: boolean
  onDone: () => void
  onError: (message: string) => void
}

export function AuthCallbackPage({ sessionReady, onDone, onError }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    if (sessionReady) {
      onDone()
      return
    }
    // detectSessionInUrl usually handles this; explicit exchange is the fallback.
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) return
    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) onError(error.message)
    })
  }, [sessionReady, onDone, onError])

  return (
    <div className="flex min-h-dvh items-center justify-center text-text-secondary">
      {t('auth.callback.signingIn')}
    </div>
  )
}
```
Then create a small container (or wire in the route) that: subscribes to `onAuthChange`, passes `sessionReady` when a session arrives, and navigates home via the router. Add i18n key `auth.callback.signingIn` = "Signing you in…" and an error key.

- [ ] **Step 4: Register the route**

In `src/app/router.tsx`, add a public (non-guarded) route `/auth/callback` rendering the container. Confirm `app/auth-guard.ts` does **not** gate it.

- [ ] **Step 5: Barrel + run + typecheck**

`src/pages/auth-callback/index.ts`: `export { AuthCallbackPage } from './ui/AuthCallbackPage'`
Run: `npx vitest run src/pages/auth-callback && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/auth-callback src/app/router.tsx src/shared/i18n/locales/en.ts
git commit -m "feat(auth): /auth/callback landing for OAuth PKCE"
```

### Task 1.5: Social buttons + real password flows in the auth UI

**Files:**
- Modify: `src/shared/ui/AuthScreen.tsx` (add a social slot), `src/pages/login/ui/LoginPage.tsx`, `src/pages/signup/ui/SignupPage.tsx`, `src/pages/forgot-password/...`
- Modify: `src/shared/i18n/locales/en.ts`
- Test: extend `src/pages/login/ui/LoginPage.test.tsx` (+ signup)

**Interfaces:**
- Consumes: `useAuthGateway()` → `signIn/signUp/signInWithProvider/requestPasswordReset`.

- [ ] **Step 1: Read the existing auth UI**

Read `AuthScreen.tsx`, `AuthField.tsx`, `LoginPage.tsx`, `SignupPage.tsx`, the forgot-password page, and one existing page test to learn the compound-component API, the form state pattern, and `renderWithProviders`. Match that shape — do not invent a new form pattern.

- [ ] **Step 2: Write the failing test**

In `LoginPage.test.tsx`:
```tsx
it('calls signInWithProvider when Continue with Google is pressed', async () => {
  const signInWithProvider = vi.fn().mockResolvedValue(undefined)
  // inject a gateway stub through the same provider the other tests use
  renderWithProviders(<LoginPage />, { gateway: { signInWithProvider /* + no-op rest */ } as never })
  await userEvent.click(screen.getByRole('button', { name: /continue with google/i }))
  expect(signInWithProvider).toHaveBeenCalledWith('google')
})
```
(Use the repo's real provider-injection helper; mirror an existing gateway-stubbing test.)

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run src/pages/login`
Expected: FAIL — no Google button.

- [ ] **Step 4: Implement**

- Add a `SocialSignIn` block (Google + Apple buttons using `lucide-react` marks + semantic tokens) as a composable slot in `AuthScreen`, shown on login + signup.
- Wire `onClick={() => void gateway.signInWithProvider('google')}` / `'apple'`, with loading + error (toast via `sonner`) + offline handling (disable when `!navigator.onLine`, show `auth.social.offline`).
- Wire the email/password submit to `gateway.signIn` / `gateway.signUp` (surface errors).
- Wire forgot-password submit to `gateway.requestPasswordReset` with a "check your email" success state.
- Add i18n keys: `auth.social.google`, `auth.social.apple`, `auth.social.offline`, `auth.reset.sent`, plus error copy.

- [ ] **Step 5: Run tests + lint + typecheck**

Run: `npx vitest run src/pages/login src/pages/signup && npm run lint && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/ui/AuthScreen.tsx src/pages/login src/pages/signup src/pages/forgot-password src/shared/i18n/locales/en.ts
git commit -m "feat(auth): social sign-in buttons + real password/reset flows"
```

### Task 1.6: Env-gated adapter selection at the composition root

**Files:**
- Modify: `src/app/composition-root.ts`
- Test: `src/app/composition-root.test.ts` (create if absent)

**Interfaces:**
- Produces: `createServices()` returns `SupabaseAuthGateway` when `isSupabaseConfigured()`, else `LocalAuthGateway`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest'

it('uses LocalAuthGateway when supabase is not configured', async () => {
  vi.doMock('@/shared/api/supabase', () => ({ isSupabaseConfigured: () => false, supabase: {} }))
  const { createServices } = await import('./composition-root')
  const services = createServices()
  expect(services.authGateway.constructor.name).toBe('LocalAuthGateway')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/app/composition-root.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the selection**

In `composition-root.ts`:
```ts
import { isSupabaseConfigured, supabase, SupabaseAuthGateway } from '@/shared/api/supabase'
// ...
const authGateway: AuthGateway = isSupabaseConfigured()
  ? new SupabaseAuthGateway(supabase)
  : new LocalAuthGateway()
```

- [ ] **Step 4: Run + typecheck; full gate**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: PASS — **Stage 1 checkpoint: auth compiles and all existing tests are green.**

- [ ] **Step 5: Commit**

```bash
git add src/app/composition-root.ts src/app/composition-root.test.ts
git commit -m "feat(auth): env-gated Supabase/local auth adapter selection"
```

---

## STAGE 2 — RxDB ↔ Supabase replication (T9.3)

### Task 2.1: Document mapping (RxDB doc ↔ Postgres row)

**Files:**
- Create: `src/shared/api/supabase/document-mapping.ts`
- Test: `src/shared/api/supabase/document-mapping.test.ts`

**Interfaces:**
- Produces: `interface Row`, `docToRow(doc, userId): PushRow`, `rowToDoc(row): T & { _deleted: boolean }`.
- `updated_at` is **never** written on push (the server trigger owns it); it is only read on pull for the checkpoint.

- [ ] **Step 1: Write the failing test**

`document-mapping.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { docToRow, rowToDoc } from './document-mapping'

it('strips _deleted into the deleted column and never sends updated_at', () => {
  const row = docToRow({ id: 'd1', name: 'Deck', _deleted: true }, 'u1')
  expect(row).toEqual({ id: 'd1', user_id: 'u1', data: { id: 'd1', name: 'Deck' }, deleted: true })
  expect('updated_at' in row).toBe(false)
})

it('reconstitutes _deleted from the deleted column on pull', () => {
  const doc = rowToDoc({ id: 'd1', data: { id: 'd1', name: 'Deck' }, deleted: false, updated_at: 't' })
  expect(doc).toEqual({ id: 'd1', name: 'Deck', _deleted: false })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/shared/api/supabase/document-mapping.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`document-mapping.ts`:
```ts
import type { Identifiable } from '@/shared/api'

export interface Row {
  id: string
  data: Record<string, unknown>
  deleted: boolean
  updated_at?: string
}

export interface PushRow {
  id: string
  user_id: string
  data: Record<string, unknown>
  deleted: boolean
}

export function docToRow<T extends Identifiable>(
  doc: T & { _deleted?: boolean },
  userId: string,
): PushRow {
  const { _deleted, ...data } = doc
  return { id: doc.id, user_id: userId, data, deleted: Boolean(_deleted) }
}

export function rowToDoc<T extends Identifiable>(row: Row): T & { _deleted: boolean } {
  return { ...(row.data as T), _deleted: row.deleted }
}
```

- [ ] **Step 4: Run + typecheck**

Run: `npx vitest run src/shared/api/supabase/document-mapping.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/api/supabase/document-mapping.ts src/shared/api/supabase/document-mapping.test.ts
git commit -m "feat(sync): rxdb doc <-> supabase row mapping"
```

### Task 2.2: Pure counter-merge for `progress`

**Files:**
- Create: `src/shared/lib/merge-progress.ts`
- Test: `src/shared/lib/merge-progress.test.ts`
- Modify: `src/shared/lib/index.ts` (barrel)

**Interfaces:**
- Produces: `mergeProgress(local: Progress, remote: Progress): Progress`.

- [ ] **Step 1: Write the failing test**

`merge-progress.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { mergeProgress } from './merge-progress'
import type { Progress } from '@/entities/progress'

const base: Progress = {
  id: 'p1', createdAt: 't0', updatedAt: 't1',
  xp: 100, streakCount: 3, longestStreak: 5, lastTrainingDate: '2026-07-20',
  streakFreezes: 1, bestQuizAccuracy: 0.8, trainingDays: ['2026-07-19', '2026-07-20'],
  activeDayKey: '2026-07-20', activeDayCount: 4,
}

it('keeps the max of monotonic counters and unions training days', () => {
  const local = { ...base, updatedAt: 't2', xp: 150, trainingDays: ['2026-07-20', '2026-07-21'] }
  const remote = { ...base, updatedAt: 't1', xp: 120, longestStreak: 9, trainingDays: ['2026-07-18'] }
  const merged = mergeProgress(local, remote)
  expect(merged.xp).toBe(150)
  expect(merged.longestStreak).toBe(9)
  expect(merged.trainingDays).toEqual(['2026-07-18', '2026-07-20', '2026-07-21'])
  expect(merged.lastTrainingDate).toBe('2026-07-20')
  expect(merged.activeDayKey).toBe('2026-07-20') // from newest (local)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/shared/lib/merge-progress.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`merge-progress.ts`:
```ts
import type { Progress } from '@/entities/progress'

const maxDate = (a: string | null, b: string | null): string | null => {
  if (!a) return b
  if (!b) return a
  return a >= b ? a : b
}

/** Field-aware merge: monotonic lifetime counters take the max, training days
 *  union, and the daily-tracking fields (activeDayKey/Count) follow the newest
 *  write so concurrent-device study is never silently clobbered. */
export function mergeProgress(local: Progress, remote: Progress): Progress {
  const newest = local.updatedAt >= remote.updatedAt ? local : remote
  return {
    ...newest,
    xp: Math.max(local.xp, remote.xp),
    streakCount: Math.max(local.streakCount, remote.streakCount),
    longestStreak: Math.max(local.longestStreak, remote.longestStreak),
    streakFreezes: Math.max(local.streakFreezes, remote.streakFreezes),
    bestQuizAccuracy: Math.max(local.bestQuizAccuracy, remote.bestQuizAccuracy),
    trainingDays: [...new Set([...local.trainingDays, ...remote.trainingDays])].sort(),
    lastTrainingDate: maxDate(local.lastTrainingDate, remote.lastTrainingDate),
  }
}
```

- [ ] **Step 4: Run + barrel + typecheck**

Add `export { mergeProgress } from './merge-progress'` to `src/shared/lib/index.ts`.
Run: `npx vitest run src/shared/lib/merge-progress.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/lib/merge-progress.ts src/shared/lib/merge-progress.test.ts src/shared/lib/index.ts
git commit -m "feat(sync): pure counter-merge for progress"
```

### Task 2.3: Pure merge for `card` + `srs`

**Files:**
- Create: `src/shared/lib/merge-srs.ts`
- Test: `src/shared/lib/merge-srs.test.ts`
- Modify: `src/shared/lib/index.ts`

**Interfaces:**
- Produces: `mergeCard(local: Card, remote: Card): Card` (content follows newest edit; `srs` merges — newest `due/interval/ease` by `lastReviewed`, `max(reps)`, `max(lapses)`; handles optional `srs`).

- [ ] **Step 1: Write the failing test**

`merge-srs.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { mergeCard } from './merge-srs'
import type { Card } from '@/entities/card'

const card = (over: Partial<Card>): Card => ({
  id: 'c1', createdAt: 't0', updatedAt: 't1', deckId: 'd1', front: 'F', back: 'B',
  flagged: false, memorized: false, order: 0, ...over,
})

it('keeps max reps/lapses and newest review state', () => {
  const local = card({
    updatedAt: 't3',
    srs: { due: '2026-07-25', interval: 4, ease: 2.4, reps: 5, lapses: 1, lastReviewed: '2026-07-21' },
  })
  const remote = card({
    updatedAt: 't2',
    srs: { due: '2026-07-24', interval: 3, ease: 2.5, reps: 6, lapses: 2, lastReviewed: '2026-07-20' },
  })
  const merged = mergeCard(local, remote)
  expect(merged.srs?.due).toBe('2026-07-25') // newest lastReviewed (local, t=07-21)
  expect(merged.srs?.reps).toBe(6) // max
  expect(merged.srs?.lapses).toBe(2) // max
  expect(merged.front).toBe('F') // content from newest updatedAt (local)
})

it('returns the defined srs when only one side has been reviewed', () => {
  const local = card({ updatedAt: 't2' })
  const remote = card({
    updatedAt: 't1',
    srs: { due: 'd', interval: 1, ease: 2.5, reps: 1, lapses: 0, lastReviewed: 'r' },
  })
  expect(mergeCard(local, remote).srs?.reps).toBe(1)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/shared/lib/merge-srs.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`merge-srs.ts`:
```ts
import type { Card } from '@/entities/card'

type Srs = NonNullable<Card['srs']>

function mergeSrs(local: Srs | undefined, remote: Srs | undefined): Srs | undefined {
  if (!local) return remote
  if (!remote) return local
  const newest = local.lastReviewed >= remote.lastReviewed ? local : remote
  return { ...newest, reps: Math.max(local.reps, remote.reps), lapses: Math.max(local.lapses, remote.lapses) }
}

export function mergeCard(local: Card, remote: Card): Card {
  const newest = local.updatedAt >= remote.updatedAt ? local : remote
  return { ...newest, srs: mergeSrs(local.srs, remote.srs) }
}
```

- [ ] **Step 4: Run + barrel + typecheck**

Add `export { mergeCard } from './merge-srs'` to `src/shared/lib/index.ts`.
Run: `npx vitest run src/shared/lib/merge-srs.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/lib/merge-srs.ts src/shared/lib/merge-srs.test.ts src/shared/lib/index.ts
git commit -m "feat(sync): pure merge for card srs"
```

### Task 2.4: Per-collection conflict handlers in the RxDB database

**Files:**
- Modify: `src/app/persistence/database.ts`
- Test: `src/app/persistence/conflict-handlers.test.ts`

**Interfaces:**
- Consumes: `mergeProgress`, `mergeCard`.
- Produces: `conflictHandler` attached to `cards`, `progress` (merge) and content collections (LWW by `data.updatedAt`).

> **Confirm the RxDB 17 `RxConflictHandler` return shape** against `node_modules/rxdb` types before implementing (the LWW example in the spec returns `{ documentData }`; newer RxDB may require `{ isEqual: false, documentData }`). The merge *logic* below is stable; only the wrapper's return literal may need adjustment.

- [ ] **Step 1: Write the failing test**

`conflict-handlers.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { lastWriteWins, mergeCardConflict, mergeProgressConflict } from './conflict-handlers'

it('lastWriteWins keeps the doc with the newer updatedAt', async () => {
  const out = await lastWriteWins({
    realMasterState: { id: 'd1', updatedAt: 't2', name: 'server' },
    newDocumentState: { id: 'd1', updatedAt: 't1', name: 'local' },
  } as never, 'ctx')
  expect(out).toMatchObject({ documentData: { name: 'server' } })
})
```
(If the confirmed RxDB contract also needs `isEqual`, assert that field too.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/app/persistence/conflict-handlers.test.ts`
Expected: FAIL.

- [ ] **Step 3: Extract handlers into `conflict-handlers.ts`**

`src/app/persistence/conflict-handlers.ts`:
```ts
import type { RxConflictHandler } from 'rxdb'
import type { Card } from '@/entities/card'
import type { Progress } from '@/entities/progress'
import { mergeCard, mergeProgress } from '@/shared/lib'

// Adjust the returned object to the confirmed RxDB 17 RxConflictHandler contract.
export const lastWriteWins: RxConflictHandler<{ id: string; updatedAt: string }> = async (i) => {
  const local = i.newDocumentState
  const master = i.realMasterState
  const winner = local.updatedAt >= master.updatedAt ? local : master
  return { isEqual: false, documentData: winner }
}

export const mergeProgressConflict: RxConflictHandler<Progress> = async (i) => ({
  isEqual: false,
  documentData: mergeProgress(i.newDocumentState, i.realMasterState),
})

export const mergeCardConflict: RxConflictHandler<Card> = async (i) => ({
  isEqual: false,
  documentData: mergeCard(i.newDocumentState, i.realMasterState),
})
```

- [ ] **Step 4: Attach in `database.ts`**

In `createAppDatabase`, pass `conflictHandler` per collection:
```ts
decks:       { schema: deckSchema,       conflictHandler: lastWriteWins as never },
cards:       { schema: cardSchema,       conflictHandler: mergeCardConflict },
folders:     { schema: folderSchema,     conflictHandler: lastWriteWins as never },
questions:   { schema: questionSchema,   conflictHandler: lastWriteWins as never },
progress:    { schema: progressSchema,   conflictHandler: mergeProgressConflict, migrationStrategies: ... },
preferences: { schema: preferencesSchema, conflictHandler: lastWriteWins as never, migrationStrategies: preferencesMigrations },
profiles:    { schema: profileSchema,    conflictHandler: lastWriteWins as never },
```
(Keep `notifications` as-is — not synced.)

- [ ] **Step 5: Run tests + full suite (RxDB DB creation is covered by `database.test.ts`)**

Run: `npx vitest run src/app/persistence && npm run typecheck`
Expected: PASS. If `database.test.ts` asserts exact `addCollections` args, update it to allow `conflictHandler`.

- [ ] **Step 6: Commit**

```bash
git add src/app/persistence/conflict-handlers.ts src/app/persistence/conflict-handlers.test.ts src/app/persistence/database.ts src/app/persistence/database.test.ts
git commit -m "feat(sync): per-collection conflict handlers (LWW + counter-merge)"
```

### Task 2.5: `createCollectionReplication` (push / pull / realtime stream)

**Files:**
- Create: `src/shared/api/supabase/replication.ts`
- Modify: `src/shared/api/supabase/index.ts`
- Test: `src/shared/api/supabase/replication.test.ts`

**Interfaces:**
- Consumes: `supabase` client, an `RxCollection<T>`, `docToRow`/`rowToDoc`.
- Produces: `createCollectionReplication<T>({ supabase, collection, table, userId }): RxReplicationState<T, Checkpoint>`, `interface Checkpoint { updated_at: string; id: string }`.

- [ ] **Step 1: Write the failing test (push mapping + pull query, mocked supabase)**

`replication.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'
import { buildPushPayload, buildPullQuery } from './replication'

it('push payload maps docs to rows with the user id', () => {
  const rows = buildPushPayload(
    [{ newDocumentState: { id: 'd1', name: 'x', _deleted: false } }] as never,
    'u1',
  )
  expect(rows).toEqual([{ id: 'd1', user_id: 'u1', data: { id: 'd1', name: 'x' }, deleted: false }])
})
```
(Expose `buildPushPayload` / `buildPullQuery` as small pure helpers so the handler logic is unit-testable without a live Postgres; the `createCollectionReplication` wiring is exercised in the Task 2.6 integration test.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/shared/api/supabase/replication.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`replication.ts`:
```ts
import type { RxCollection } from 'rxdb'
import type {
  ReplicationPullHandlerResult,
  RxReplicationState,
  RxReplicationWriteToMasterRow,
} from 'rxdb'
import { replicateRxCollection } from 'rxdb/plugins/replication'
import { Subject } from 'rxjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Identifiable } from '@/shared/api'
import { docToRow, type PushRow, rowToDoc, type Row } from './document-mapping'

export interface Checkpoint {
  updated_at: string
  id: string
}

export function buildPushPayload<T extends Identifiable>(
  rows: RxReplicationWriteToMasterRow<T>[],
  userId: string,
): PushRow[] {
  return rows.map((r) => docToRow(r.newDocumentState as T & { _deleted?: boolean }, userId))
}

export function createCollectionReplication<T extends Identifiable>(opts: {
  supabase: SupabaseClient
  collection: RxCollection<T>
  table: string
  userId: string
}): RxReplicationState<T, Checkpoint> {
  const { supabase, collection, table, userId } = opts
  const pullStream$ = new Subject<ReplicationPullHandlerResult<T, Checkpoint> | 'RESYNC'>()

  supabase
    .channel(`sync:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      const row = payload.new as Row
      if (!row?.id) return
      pullStream$.next({
        documents: [rowToDoc<T>(row)],
        checkpoint: { updated_at: row.updated_at ?? new Date().toISOString(), id: row.id },
      })
    })
    .subscribe((status) => {
      // After any drop/reconnect, force RxDB to re-pull from its last checkpoint.
      if (status === 'SUBSCRIBED') pullStream$.next('RESYNC')
    })

  return replicateRxCollection<T, Checkpoint>({
    collection,
    replicationIdentifier: `supabase-${table}`,
    deletedField: '_deleted',
    live: true,
    push: {
      async handler(rows) {
        const { error } = await supabase
          .from(table)
          .upsert(buildPushPayload(rows, userId), { onConflict: 'id' })
        if (error) throw new Error(error.message)
        return [] // server conflicts resolve locally via the collection conflictHandler
      },
    },
    pull: {
      async handler(checkpoint, batchSize) {
        let query = supabase
          .from(table)
          .select('id,data,deleted,updated_at')
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(batchSize)
        if (checkpoint) query = query.gt('updated_at', checkpoint.updated_at)
        const { data, error } = await query
        if (error) throw new Error(error.message)
        const list = (data ?? []) as Row[]
        const last = list.at(-1)
        return {
          documents: list.map((row) => rowToDoc<T>(row)),
          checkpoint: last ? { updated_at: last.updated_at ?? '', id: last.id } : checkpoint,
        }
      },
      stream$: pullStream$.asObservable(),
    },
  })
}
```
> Note: the pull uses `gt(updated_at)`. Rows sharing an identical server timestamp at a batch boundary are an edge case (microsecond `now()` makes it rare); if it surfaces, harden to keyset pagination (`updated_at > cp OR (updated_at = cp AND id > cp.id)`). Track as a follow-up, not a blocker.

- [ ] **Step 4: Barrel + run + typecheck**

Add `export { createCollectionReplication, type Checkpoint } from './replication'` to the supabase barrel.
Run: `npx vitest run src/shared/api/supabase/replication.test.ts && npm run typecheck`
Expected: PASS. (Confirm exact `rxdb/plugins/replication` type names against `node_modules/rxdb`; adjust imports if the alias differs.)

- [ ] **Step 5: Commit**

```bash
git add src/shared/api/supabase/replication.ts src/shared/api/supabase/replication.test.ts src/shared/api/supabase/index.ts
git commit -m "feat(sync): supabase replication (upsert push, checkpoint pull, realtime stream)"
```

### Task 2.6: Two-client convergence integration test

**Files:**
- Test: `src/shared/api/supabase/replication.integration.test.ts`

**Interfaces:**
- Consumes: `createCollectionReplication`, a real (local-stack) or PGlite-backed Supabase, two RxDB instances.

- [ ] **Step 1: Write the integration test**

Model it on the repo's `rxdb-persistence.test.ts` (fake-indexeddb). Two RxDB databases A and B replicate to the same table; assert:
- write on A → appears on B (`awaitInSync` then query B);
- offline write on B while A also writes the same doc → after reconnect, both converge to the conflict-handled result;
- delete on A → tombstone (`_deleted`) propagates and the doc is gone on B.

```ts
it('converges a write from client A to client B', async () => {
  // start replication for A and B against the same table + userId
  // await repA.awaitInSync(); await repB.awaitInSync()
  // A: decksA.upsert({ id: 'd1', name: 'Hello', updatedAt: 't1', ... })
  // await eventual consistency; expect decksB.findOne('d1') to resolve to name 'Hello'
})
```
Guard the suite with `describe.skipIf(!process.env.SUPABASE_TEST_URL)` so CI without a stack stays green; document `SUPABASE_TEST_URL`/`SUPABASE_TEST_KEY` in the test header.

- [ ] **Step 2: Run against a local stack**

Run: `SUPABASE_TEST_URL=... SUPABASE_TEST_KEY=... npx vitest run src/shared/api/supabase/replication.integration.test.ts`
Expected: PASS (convergence, offline-merge, tombstone).

- [ ] **Step 3: Commit**

```bash
git add src/shared/api/supabase/replication.integration.test.ts
git commit -m "test(sync): two-client convergence + offline-merge + tombstone"
```

---

## STAGE 3 — Sync-on-leave & durability (T9.4)

### Task 3.1: `SyncManager` — owns all replication states

**Files:**
- Create: `src/shared/api/supabase/sync-manager.ts`
- Modify: `src/shared/api/supabase/index.ts`
- Test: `src/shared/api/supabase/sync-manager.test.ts`

**Interfaces:**
- Consumes: `createCollectionReplication`, `RxReplicationState`.
- Produces: `class SyncManager { start(userId): void; stop(): Promise<void>; flush(): Promise<void>; isInSync(): Promise<boolean> }`.

- [ ] **Step 1: Write the failing test (injected replication factory)**

`sync-manager.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'
import { SyncManager } from './sync-manager'

const fakeRep = () => ({ reSync: vi.fn(), awaitInSync: vi.fn().mockResolvedValue(true), cancel: vi.fn().mockResolvedValue(undefined) })

it('starts one replication per registered collection and flushes them all', async () => {
  const reps = [fakeRep(), fakeRep()]
  let i = 0
  const manager = new SyncManager([
    { table: 'decks', collection: {} as never },
    { table: 'cards', collection: {} as never },
  ], () => reps[i++] as never)
  manager.start('u1')
  await manager.flush()
  expect(reps[0].reSync).toHaveBeenCalled()
  expect(reps[1].awaitInSync).toHaveBeenCalled()
})

it('is a no-op flush before start', async () => {
  const manager = new SyncManager([], () => fakeRep() as never)
  await expect(manager.flush()).resolves.toBeUndefined()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/shared/api/supabase/sync-manager.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`sync-manager.ts`:
```ts
import type { RxCollection } from 'rxdb'
import type { RxReplicationState } from 'rxdb'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Identifiable } from '@/shared/api'
import { type Checkpoint, createCollectionReplication } from './replication'

export interface SyncTarget {
  table: string
  collection: RxCollection<Identifiable>
}

type RepFactory = (userId: string, target: SyncTarget) => RxReplicationState<Identifiable, Checkpoint>

export class SyncManager {
  private states: RxReplicationState<Identifiable, Checkpoint>[] = []

  constructor(
    private readonly targets: SyncTarget[],
    private readonly makeReplication: RepFactory,
  ) {}

  static fromSupabase(supabase: SupabaseClient, targets: SyncTarget[]): SyncManager {
    return new SyncManager(targets, (userId, target) =>
      createCollectionReplication({ supabase, userId, table: target.table, collection: target.collection }),
    )
  }

  start(userId: string): void {
    if (this.states.length) return
    this.states = this.targets.map((t) => this.makeReplication(userId, t))
  }

  async flush(): Promise<void> {
    await Promise.all(
      this.states.map(async (s) => {
        await s.reSync()
        await s.awaitInSync()
      }),
    )
  }

  async isInSync(): Promise<boolean> {
    const results = await Promise.all(this.states.map((s) => s.awaitInSync()))
    return results.every(Boolean)
  }

  async stop(): Promise<void> {
    await Promise.all(this.states.map((s) => s.cancel()))
    this.states = []
  }
}
```

- [ ] **Step 4: Barrel + run + typecheck**

Add `export { SyncManager, type SyncTarget } from './sync-manager'` to the supabase barrel.
Run: `npx vitest run src/shared/api/supabase/sync-manager.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/api/supabase/sync-manager.ts src/shared/api/supabase/sync-manager.test.ts src/shared/api/supabase/index.ts
git commit -m "feat(sync): SyncManager owning replication states + flush/isInSync"
```

### Task 3.2: Flush-on-leave + storage durability

**Files:**
- Create: `src/app/providers/SyncProvider.tsx`
- Modify: `src/app/composition-root.ts` (build `SyncManager`, expose on `Services`), `src/app/providers/AppProviders.tsx` (mount `SyncProvider`)
- Test: `src/app/providers/SyncProvider.test.tsx`

**Interfaces:**
- Consumes: `Services.syncManager` (nullable when Supabase not configured), session store (to start on account, stop on sign-out).
- Produces: visibility/pagehide flush + `navigator.storage.persist()` at mount.

- [ ] **Step 1: Write the failing test**

```tsx
it('flushes on visibilitychange=hidden', () => {
  const flush = vi.fn().mockResolvedValue(undefined)
  render(<SyncProvider syncManager={{ start: vi.fn(), flush, stop: vi.fn() } as never} userId="u1" />)
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
  expect(flush).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/app/providers/SyncProvider.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

`SyncProvider.tsx`:
```tsx
import { type ReactNode, useEffect } from 'react'
import type { SyncManager } from '@/shared/api/supabase'

interface Props {
  syncManager: Pick<SyncManager, 'start' | 'flush' | 'stop'> | null
  userId: string | null
  children?: ReactNode
}

export function SyncProvider({ syncManager, userId, children }: Props) {
  useEffect(() => {
    void navigator.storage?.persist?.()
  }, [])

  useEffect(() => {
    if (!syncManager || !userId) return
    syncManager.start(userId)
    const onLeave = () => {
      if (document.visibilityState === 'hidden') void syncManager.flush()
    }
    document.addEventListener('visibilitychange', onLeave)
    window.addEventListener('pagehide', onLeave)
    return () => {
      document.removeEventListener('visibilitychange', onLeave)
      window.removeEventListener('pagehide', onLeave)
      void syncManager.stop()
    }
  }, [syncManager, userId])

  return children
}
```
Wire it in `AppProviders` below `AuthProvider`, reading `userId` from the session store (account only) and `syncManager` from services. Build `syncManager` in `composition-root.ts` only when `isSupabaseConfigured()` (else `null`), registering the 7 sync targets from the app collections.

- [ ] **Step 4: Run + typecheck**

Run: `npx vitest run src/app/providers/SyncProvider.test.tsx && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/providers/SyncProvider.tsx src/app/providers/SyncProvider.test.tsx src/app/providers/AppProviders.tsx src/app/composition-root.ts
git commit -m "feat(sync): flush-on-leave + storage.persist via SyncProvider"
```

### Task 3.3: Workbox Background Sync for queued pushes

**Files:**
- Modify: `vite.config.ts` (Workbox `runtimeCaching`)

**Interfaces:**
- Produces: a `BackgroundSyncPlugin`-backed route for `POST/PATCH` to the Supabase REST host so writes queued while offline/closing replay after the tab dies.

- [ ] **Step 1: Add the runtime-caching rule**

In `vite.config.ts` `VitePWA({ workbox: { runtimeCaching: [...] } })`, add:
```ts
{
  urlPattern: ({ url }) => url.origin === import.meta.env.VITE_SUPABASE_URL && url.pathname.startsWith('/rest/'),
  handler: 'NetworkOnly',
  method: 'POST',
  options: {
    backgroundSync: {
      name: 'supabase-push-queue',
      options: { maxRetentionTime: 24 * 60 },
    },
  },
}
```
(Repeat for `'PATCH'`. `VITE_SUPABASE_URL` is not available in the SW build scope the same way — resolve the origin at config time from `process.env.VITE_SUPABASE_URL` / `loadEnv`, and skip the rule when unset.)

- [ ] **Step 2: Verify the build still produces a service worker**

Run: `npm run build`
Expected: build succeeds; `dist/sw.js` present and references `supabase-push-queue` (grep the generated SW).

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat(sync): workbox background-sync queue for supabase pushes"
```

---

## STAGE 4 — Storage (T9.5)

### Task 4.1: `StoragePort` + no-op local adapter

**Files:**
- Create: `src/shared/api/storage-port.ts`
- Modify: `src/shared/api/index.ts`
- Test: `src/shared/api/storage-port.test.ts`

**Interfaces:**
- Produces: `interface StoragePort { upload(input: UploadInput): Promise<{ url: string }>; remove(bucket: StorageBucket, path: string): Promise<void> }`, `interface UploadInput { bucket: StorageBucket; path: string; file: Blob; contentType?: string }`, `type StorageBucket = 'deck-images' | 'avatars'`, `class LocalObjectUrlStorage implements StoragePort` (returns `URL.createObjectURL`, no network).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { LocalObjectUrlStorage } from './storage-port'

it('returns an object URL without any network', async () => {
  const storage = new LocalObjectUrlStorage()
  const { url } = await storage.upload({ bucket: 'deck-images', path: 'u1/d1', file: new Blob(['x']) })
  expect(url).toMatch(/^blob:|^data:|^mock/)
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/shared/api/storage-port.test.ts` → FAIL.

- [ ] **Step 3: Implement**

`storage-port.ts`:
```ts
export type StorageBucket = 'deck-images' | 'avatars'

export interface UploadInput {
  bucket: StorageBucket
  path: string
  file: Blob
  contentType?: string
}

export interface StoragePort {
  upload(input: UploadInput): Promise<{ url: string }>
  remove(bucket: StorageBucket, path: string): Promise<void>
}

export class LocalObjectUrlStorage implements StoragePort {
  async upload(input: UploadInput): Promise<{ url: string }> {
    return { url: URL.createObjectURL(input.file) }
  }
  async remove(): Promise<void> {}
}
```

- [ ] **Step 4: Barrel + run + typecheck** — add to `src/shared/api/index.ts`; `npx vitest run src/shared/api/storage-port.test.ts && npm run typecheck` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/api/storage-port.ts src/shared/api/storage-port.test.ts src/shared/api/index.ts
git commit -m "feat(storage): StoragePort + local object-url adapter"
```

### Task 4.2: Supabase storage adapter

**Files:**
- Create: `src/shared/api/supabase/supabase-storage.ts`
- Modify: `src/shared/api/supabase/index.ts`
- Test: `src/shared/api/supabase/supabase-storage.test.ts`

**Interfaces:**
- Consumes: `supabase.storage`, `StoragePort`, `UploadInput`.
- Produces: `class SupabaseStorage implements StoragePort`.

- [ ] **Step 1: Write the failing test (mocked storage)**

```ts
import { describe, expect, it, vi } from 'vitest'
import { SupabaseStorage } from './supabase-storage'

it('uploads and returns the public URL', async () => {
  const from = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/x' } }),
  }
  const client = { storage: { from: vi.fn().mockReturnValue(from) } }
  const storage = new SupabaseStorage(client as never)
  const { url } = await storage.upload({ bucket: 'deck-images', path: 'u1/d1', file: new Blob(['x']) })
  expect(url).toBe('https://cdn/x')
  expect(from.upload).toHaveBeenCalledWith('u1/d1', expect.any(Blob), { upsert: true, contentType: undefined })
})
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Implement**

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { StorageBucket, StoragePort, UploadInput } from '@/shared/api'

export class SupabaseStorage implements StoragePort {
  constructor(private readonly client: SupabaseClient) {}

  async upload(input: UploadInput): Promise<{ url: string }> {
    const bucket = this.client.storage.from(input.bucket)
    const { error } = await bucket.upload(input.path, input.file, {
      upsert: true,
      contentType: input.contentType,
    })
    if (error) throw new Error(error.message)
    return { url: bucket.getPublicUrl(input.path).data.publicUrl }
  }

  async remove(bucket: StorageBucket, path: string): Promise<void> {
    const { error } = await this.client.storage.from(bucket).remove([path])
    if (error) throw new Error(error.message)
  }
}
```

- [ ] **Step 4: Barrel + run + typecheck** → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/api/supabase/supabase-storage.ts src/shared/api/supabase/supabase-storage.test.ts src/shared/api/supabase/index.ts
git commit -m "feat(storage): supabase storage adapter"
```

### Task 4.3: Storage buckets + RLS migration

**Files:**
- Create: `supabase/migrations/<ts>_phase9_storage.sql`

- [ ] **Step 1: Write the migration**

```sql
insert into storage.buckets (id, name, public)
values ('deck-images', 'deck-images', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Users may write/delete only under their own "<uid>/..." prefix; read is public.
do $$
declare b text;
begin
  foreach b in array array['deck-images','avatars'] loop
    execute format($p$create policy "%1$s_read" on storage.objects for select using (bucket_id = %1$L);$p$, b);
    execute format($p$create policy "%1$s_write" on storage.objects for insert with check (bucket_id = %1$L and (storage.foldername(name))[1] = auth.uid()::text);$p$, b);
    execute format($p$create policy "%1$s_update" on storage.objects for update using (bucket_id = %1$L and (storage.foldername(name))[1] = auth.uid()::text);$p$, b);
    execute format($p$create policy "%1$s_delete" on storage.objects for delete using (bucket_id = %1$L and (storage.foldername(name))[1] = auth.uid()::text);$p$, b);
  end loop;
end $$;
```

- [ ] **Step 2: Apply + verify** — `npx supabase db reset`; confirm both buckets exist and 8 storage policies present.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations
git commit -m "feat(storage): buckets + per-user storage RLS"
```

### Task 4.4: Offline-graceful image upload in the deck/profile image command

**Files:**
- Modify: the feature command that sets a deck image (inspect `src/features/deck/` and `src/features/profile/` for the current image-set path) + the entity `image`/`avatar` write.
- Test: colocated command test.

**Interfaces:**
- Consumes: `StoragePort` (via `useStorage()`/services), the deck/profile store.
- Produces: `setDeckImage(store, storage, { deckId, file })` — saves the deck immediately with a local object URL, uploads best-effort, patches the stored URL on success.

- [ ] **Step 1: Read the current image-set flow** and identify where `deck.image` is assigned today.

- [ ] **Step 2: Write the failing test**

```ts
it('saves immediately with a local url, then patches the uploaded url', async () => {
  const storage = { upload: vi.fn().mockResolvedValue({ url: 'https://cdn/x' }), remove: vi.fn() }
  const saved: string[] = []
  const store = { getState: () => ({ save: (d: { image: string }) => { saved.push(d.image); return Promise.resolve(d) }, getById: () => ({ id: 'd1' }) }) }
  await setDeckImage(store as never, storage as never, { deckId: 'd1', file: new Blob(['x']) })
  expect(saved.at(-1)).toBe('https://cdn/x')
})
```

- [ ] **Step 3: Run to verify it fails** → FAIL.

- [ ] **Step 4: Implement** the command: write local URL → `store.save` → `storage.upload` (guarded try/catch; on failure keep the local URL, Background Sync + a later retry reconcile) → on success `store.save` with the CDN URL. Use `${userId}/${deckId}` as the path.

- [ ] **Step 5: Run + lint + typecheck** → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/deck src/features/profile
git commit -m "feat(storage): offline-graceful deck/profile image upload"
```

---

## STAGE 5 — Guest → account claim (T9.6)

### Task 5.1: `resolveDataTransition` + `claimGuestData` command

**Files:**
- Create: `src/shared/lib/data-transition.ts`, `src/features/auth/claim-guest-data.ts`, `src/features/auth/index.ts`
- Modify: `src/shared/lib/index.ts`
- Test: `src/shared/lib/data-transition.test.ts`, `src/features/auth/claim-guest-data.test.ts`

**Interfaces:**
- Produces: `resolveDataTransition(prev, next): 'preserve' | 'reset' | 'none'` and `claimGuestData(deps): Promise<void>`.
- Rules: guest/null → account = **preserve** (local data pushes into the new account); account A → account B(≠A) = **reset** (wipe local, pull B's); same id or sign-out = **none**.

- [ ] **Step 1: Write the failing test for the pure fn**

`data-transition.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { resolveDataTransition } from './data-transition'
import type { PersistedAuth } from '@/shared/api'

const guest: PersistedAuth = { id: 'g1', kind: 'guest' }
const a: PersistedAuth = { id: 'a', kind: 'account' }
const b: PersistedAuth = { id: 'b', kind: 'account' }

it('preserves local data when a guest becomes an account', () => {
  expect(resolveDataTransition(guest, a)).toBe('preserve')
  expect(resolveDataTransition(null, a)).toBe('preserve')
})
it('resets when switching between two different accounts', () => {
  expect(resolveDataTransition(a, b)).toBe('reset')
})
it('does nothing for the same account or sign-out', () => {
  expect(resolveDataTransition(a, a)).toBe('none')
  expect(resolveDataTransition(a, null)).toBe('none')
})
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/shared/lib/data-transition.test.ts` → FAIL.

- [ ] **Step 3: Implement the pure fn**

`data-transition.ts`:
```ts
import type { PersistedAuth } from '@/shared/api'

export type DataTransition = 'preserve' | 'reset' | 'none'

export function resolveDataTransition(
  prev: PersistedAuth | null,
  next: PersistedAuth | null,
): DataTransition {
  if (!next || next.kind !== 'account') return 'none'
  if (!prev || prev.kind === 'guest') return 'preserve'
  return prev.id === next.id ? 'none' : 'reset'
}
```

- [ ] **Step 4: Write the failing test for the command**

`claim-guest-data.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'
import { claimGuestData } from './claim-guest-data'

it('starts sync and keeps local data on preserve', async () => {
  const syncManager = { start: vi.fn(), stop: vi.fn() }
  const resetLocal = vi.fn().mockResolvedValue(undefined)
  await claimGuestData({ transition: 'preserve', userId: 'a', syncManager: syncManager as never, resetLocal })
  expect(syncManager.start).toHaveBeenCalledWith('a')
  expect(resetLocal).not.toHaveBeenCalled()
})

it('resets local before starting sync on reset', async () => {
  const syncManager = { start: vi.fn(), stop: vi.fn().mockResolvedValue(undefined) }
  const resetLocal = vi.fn().mockResolvedValue(undefined)
  await claimGuestData({ transition: 'reset', userId: 'b', syncManager: syncManager as never, resetLocal })
  expect(resetLocal).toHaveBeenCalled()
})
```

- [ ] **Step 5: Run to verify it fails** → FAIL.

- [ ] **Step 6: Implement the command**

`claim-guest-data.ts`:
```ts
import type { DataTransition } from '@/shared/lib'
import type { SyncManager } from '@/shared/api/supabase'

interface Deps {
  transition: DataTransition
  userId: string
  syncManager: Pick<SyncManager, 'start' | 'stop'>
  resetLocal: () => Promise<void>
}

export async function claimGuestData({ transition, userId, syncManager, resetLocal }: Deps): Promise<void> {
  if (transition === 'none') {
    syncManager.start(userId)
    return
  }
  if (transition === 'reset') {
    await syncManager.stop()
    await resetLocal() // wipes local RxDB so pull rehydrates the new account
  }
  syncManager.start(userId) // 'preserve' path: local guest docs push into the new account
}
```

- [ ] **Step 7: Barrel + run + typecheck** — export `resolveDataTransition`/`DataTransition` from `shared/lib`, `claimGuestData` from `features/auth`. Run targeted tests + `npm run typecheck` → PASS.

- [ ] **Step 8: Commit**

```bash
git add src/shared/lib/data-transition.ts src/shared/lib/data-transition.test.ts src/shared/lib/index.ts src/features/auth
git commit -m "feat(sync): guest->account claim decision + command"
```

### Task 5.2: Local DB reset + wire the transition into SyncProvider

**Files:**
- Create: `src/app/persistence/reset-local-database.ts`
- Modify: `src/app/providers/SyncProvider.tsx` (track prev auth, call `claimGuestData` on change), `src/app/composition-root.ts` (provide `resetLocal`)
- Test: `src/app/persistence/reset-local-database.test.ts`

**Interfaces:**
- Produces: `resetLocalDatabase(storage): Promise<void>` (via `removeRxDatabase(STORAGE_PREFIX, storage)`), then a full reload to rebuild stores cleanly.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest'

it('removes the app database by name', async () => {
  const removeRxDatabase = vi.fn().mockResolvedValue(undefined)
  vi.doMock('rxdb', () => ({ removeRxDatabase }))
  const { resetLocalDatabase } = await import('./reset-local-database')
  await resetLocalDatabase({} as never, { reload: vi.fn() } as never)
  expect(removeRxDatabase).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Implement**

```ts
import { removeRxDatabase } from 'rxdb'
import type { RxStorage } from 'rxdb'
import { STORAGE_PREFIX } from '@/shared/config/constants'

export async function resetLocalDatabase(
  storage: RxStorage<unknown, unknown>,
  location: Pick<Location, 'reload'> = window.location,
): Promise<void> {
  await removeRxDatabase(STORAGE_PREFIX, storage)
  location.reload() // rebuild composition root + stores against the empty DB; pull rehydrates
}
```

- [ ] **Step 4: Wire into `SyncProvider`** — keep a `useRef<PersistedAuth | null>` of the previous auth; on each auth change compute `resolveDataTransition(prev, next)` and, for account users, call `claimGuestData({ transition, userId, syncManager, resetLocal })`. `resetLocal` comes from services (bound to the app storage).

- [ ] **Step 5: Run + typecheck** → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/persistence/reset-local-database.ts src/app/persistence/reset-local-database.test.ts src/app/providers/SyncProvider.tsx src/app/composition-root.ts
git commit -m "feat(sync): local db reset on user switch; wire claim into SyncProvider"
```

### Task 5.3: End-to-end guest → signup → second-device test

**Files:**
- Test: `src/shared/api/supabase/guest-claim.integration.test.ts`

- [ ] **Step 1: Write the integration test** (guarded by `SUPABASE_TEST_URL`, mirrors Task 2.6): seed local RxDB "A" as a guest with 2 decks; run the `preserve` claim for a fresh account; assert the rows exist server-side; start a clean RxDB "B" for the same account and assert both decks pull down.

- [ ] **Step 2: Run against the local stack** → PASS.

- [ ] **Step 3: Full gate + commit**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: PASS — **Checkpoint 9: real accounts + guest-claim + cross-device sync + storage; still fully usable offline.**
```bash
git add src/shared/api/supabase/guest-claim.integration.test.ts
git commit -m "test(sync): guest -> signup -> second-device claim round-trip"
```

---

## Spec coverage (self-review map)

| Spec section | Task(s) |
| --- | --- |
| §4 T9.1 tables + trigger | 0.2 |
| §4 T9.1 RLS + Realtime | 0.3 |
| §5 T9.2 widened port + Local adapter | 1.1 |
| §5 T9.2 Supabase auth adapter | 1.2 |
| §5 T9.2 restore-session + AuthProvider | 1.3 |
| §5 T9.2 /auth/callback (PKCE) | 1.4 |
| §5 T9.2 social buttons + password/reset UI | 1.5 |
| §5/§10 env-gated adapter selection | 1.6 |
| §6 T9.3 doc↔row mapping | 2.1 |
| §6 T9.3 counter-merge (progress/srs) | 2.2, 2.3 |
| §6 T9.3 conflict handlers | 2.4 |
| §6 T9.3 replication (push/pull/stream) | 2.5 |
| §12 two-client / offline / tombstone tests | 2.6 |
| §7 T9.4 SyncManager | 3.1 |
| §7 T9.4 flush-on-leave + storage.persist | 3.2 |
| §7 T9.4 Workbox Background Sync | 3.3 |
| §8 T9.5 StoragePort + local adapter | 4.1 |
| §8 T9.5 Supabase storage adapter | 4.2 |
| §8 T9.5 buckets + storage RLS | 4.3 |
| §8 T9.5 offline-graceful upload | 4.4 |
| §9 T9.6 claim decision + command | 5.1 |
| §9 T9.6 local reset / user-switch | 5.2 |
| §12/§13 guest-claim round-trip | 5.3 |
| §10 provider config (Google/Apple) | External prerequisite — documented, no task |

## Notes carried from the spec

- **Apple/Google credentials are external** (§10) — social buttons are inert until configured; **Apple secret rotates every 6 months**.
- **Apple web returns no name** — Apple sign-ups start with empty `name`, set during profile onboarding.
- **No RxDB schema migration** — verify each `updateX()` bumps `updatedAt` before relying on LWW (spot-check during Stage 2).
- **RxDB 17 `RxConflictHandler` return shape** — confirm against `node_modules/rxdb` in Task 2.4 (the one library-signature detail to pin).
