# 05 — Server hardening before 1.0

Status: ready-for-human
Type: task

Deployment checked 2026-10-28 on `dimdowcidkuuxmfdizqt`: all 14 migrations applied, `request-account-deletion` and
`purge-account` active, `pg_cron` and `pg_net` on, `project_url` and `secret_key` in Vault, `purge-accounts` and
`trim-history` succeeding nightly (the purge's request returns 200).

Left, from Supabase's security advisor:

1. **`public.rls_auto_enable()`** is `SECURITY DEFINER` and callable by `anon` and `authenticated` through
   `/rest/v1/rpc/rls_auto_enable`. It isn't in `supabase/migrations/` (made from the dashboard). Revoke `EXECUTE` from
   `anon`, `authenticated` and `public` in a migration, so the repo records it.
2. **Leaked password protection** is off. Turn it on in Auth settings (dashboard; not a migration).
3. `private.corpus_publishers` has RLS on and no policies. Intended: only the service role reads it (ADR 0009). No
   action.
