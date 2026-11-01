# Admin

Status: ready-for-agent

The owner asked for an overview of every account for admins, groups of accounts, rolling an update out to one group
before the rest, a way to report a bug from the app, and the developer tools hidden from learners before 1.0.

**Copy piano-trainer's admin, adapted.** The owner's `piano-trainer` repo (github.com/tt8747430-png/piano-trainer,
clone it read-only beside this one) built all of this on the same stack (Supabase, React 19, FSD), and its ADR 0116 says
it copied this repo's accounts and sync to begin with. Read its `docs/adr/0116-the-backend.md` (Admin, r5, r7) first.
Take its design and code; adapt names, layers and i18n to this repo. Leave out what is piano-only: content editing,
drafts, the Public library and its reports, the `editor` role.

| Piano-trainer                                                                             | What it is                                                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `supabase/migrations/20261029160000_admin.sql`                                            | `is_admin()`, `admin_bootstrap`, groups, members, feature switches, `admin_log`, `my_features()` |
| `supabase/migrations/20261029180000_error_reports.sql`, `…200000_error_reports_purge.sql` | `error_reports`, written by anyone, capped, read by admins, purged                               |
| `supabase/functions/admin/`                                                               | the Edge Function that lists accounts and sets roles, checking the caller                        |
| `src/shared/api/admin/` (`types`, `supabase`, `fake`)                                     | `AdminPort`, `FeaturesPort`, and their adapters                                                  |
| `src/shared/api/errors/`                                                                  | the error reporter                                                                               |
| `src/shared/lib/admin/`, `src/shared/lib/features/`                                       | `useAdmin`, `FeaturesProvider`, `useFeature`                                                     |
| `src/pages/admin/`, `src/app/routes/admin-screens.ts`, `admin-search.ts`                  | the Admin area and its tabs                                                                      |
| `src/shared/api/auth/supabase-auth.ts` (`roleOf`)                                         | the role read from `app_metadata` into the account                                               |

## Decisions (from piano-trainer, the owner's own)

- **Admin** is a role only the server sets: `app_metadata.role = 'admin'`; everyone else is a learner. Row-level
  security, Edge Functions and the app read it from the JWT. The first admin is the owner: their address sits in
  `admin_bootstrap` (database only, never the repo) and their account becomes an admin when made or on the next
  sign-in.
- **Accounts** are listed and their roles changed only through the `admin` Edge Function, which checks the caller's
  role itself; never a client query on `auth.users`.
- **A rollout is a feature switch.** One origin serves one service worker, so a PWA can't give two groups two builds.
  Every build goes to everyone; a new feature waits behind its switch, on for everyone, nobody, or chosen groups. The
  app asks `my_features()` at start and at each sign-in. This sits beside the extensions' own feature switches
  (`preferences.disabledFeatures`, ADR 0009): those are the learner's choice, these are the admin's release gate.
- **Every admin change is logged** in `admin_log`.
- **Errors report themselves:** a screen's error and one never caught, once a run, ten at most, into `error_reports`;
  no third party.
- **The Admin area** is `/admin`, its own lazy chunk, linked from Settings for admins only, with tabs: Overview,
  Accounts, Groups, Switches, Errors, Bug reports, Activity, Components.
- **Developer tools are admin tools.** The kitchen sink becomes the Components tab and the viewport probe and dev mode
  move under the Admin area; nothing developer-facing renders for a learner. This replaces ADR 0002's "ships in every
  build until 1.0".

## Issues

1. `01-roles-and-the-first-admin.md`
2. `02-the-admin-function-and-accounts.md`
3. `03-groups-and-feature-switches.md`
4. `04-error-reports.md`
5. `05-report-a-bug.md`
6. `06-the-admin-area.md`

Write ADR 0011 (admin) when 01–03 land; amend ADR 0002 (developer surface) with 06.
