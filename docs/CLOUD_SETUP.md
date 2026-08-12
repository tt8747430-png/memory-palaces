# Cloud setup (Phase 9)

Everything here is optional. With no `VITE_SUPABASE_URL`, Mindscape runs exactly as it did before
the cloud existed: local identity, no sync, no uploads. The adapters are chosen once, in
`app/composition-root.ts`.

## 1. Environment

Copy `.env.example` to `.env.local` (gitignored) and fill in:

| Variable                        | Where                                                                |
| ------------------------------- | -------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Dashboard → Project Settings → API                                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Dashboard → Project Settings → API Keys → the `sb_publishable_…` key |

The `sb_secret_…` key is server-side only and must never reach the client bundle.

## 2. Migrations

Four migrations under `supabase/migrations/` must be applied before sync will work:

| File                    | What it creates                                                                |
| ----------------------- | ------------------------------------------------------------------------------ |
| `…_phase9_tables.sql`   | Seven mirror tables + the `set_updated_at()` server-clock trigger              |
| `…_phase9_rls.sql`      | Per-user RLS on all seven, plus the explicit Data API grant to `authenticated` |
| `…_phase9_realtime.sql` | Adds the tables to the `supabase_realtime` publication                         |
| `…_phase9_storage.sql`  | `deck-images` + `avatars` buckets and their per-prefix policies                |

```bash
supabase link --project-ref <ref>
supabase db push          # remote
# or, locally, with Docker running:
supabase start && supabase db reset
```

Afterwards, confirm nothing is exposed by accident:

```bash
supabase db advisors --type security
```

Expect no "RLS disabled" findings for `decks, cards, folders, questions, progress, preferences,
profiles`.

## 3. Redirect URLs

Auth → URL Configuration → Redirect URLs must list `/auth/callback` for **every** origin the app
runs on (`http://localhost:5173/auth/callback` and each deployed domain). `signInWithProvider`
always sends `redirectTo: ${window.location.origin}/auth/callback`.

## 4. Social providers

Email/password and password reset need no provider setup. The Google and Apple buttons ship
complete and are inert until these exist:

**Google** — Google Cloud console → OAuth 2.0 client of type _Web application_. Authorized
JavaScript origins = the app's domains; authorized redirect URI =
`https://<ref>.supabase.co/auth/v1/callback`. Paste the client ID and secret into Auth → Providers →
Google.

**Apple** — Apple Developer → App ID with "Sign in with Apple" enabled → a **Services ID** (this is
the client ID) whose website URLs list the domain `<ref>.supabase.co` and the return URL
`https://<ref>.supabase.co/auth/v1/callback` → a **Sign in with Apple key** (`.p8`). Generate the
client secret from the `.p8` and enter client ID, team ID, key ID and secret under Auth → Providers
→ Apple.

> ⚠️ **Apple's client secret expires every 6 months.** Keep the `.p8` and set a recurring reminder —
> when it lapses, Apple sign-in breaks silently while everything else keeps working.
>
> Apple's web flow also returns no name, so Apple sign-ups start with an empty display name and fill
> it in during profile onboarding.

## 5. Running the sync tests

The unit tests need nothing. The two integration suites are skipped unless a stack is pointed at:

```bash
SUPABASE_TEST_URL=http://127.0.0.1:54321 \
SUPABASE_TEST_KEY=<publishable key> \
npx vitest run src/shared/api/supabase
```

They cover two-client convergence, last-write-wins on a concurrent edit, tombstone propagation, and
the guest → account → second-device claim.
