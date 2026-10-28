# 05 — Server hardening before 1.0

Status: ready-for-human
Type: task

Deployment checked 2026-10-28 on `dimdowcidkuuxmfdizqt`: every migration applied, `request-account-deletion` and
`purge-account` active, `pg_cron` and `pg_net` on, `project_url` and `secret_key` in Vault, `purge-accounts` and
`trim-history` succeeding nightly. `20261028091741_harden_grants` closed the advisor's function grant and the corpus's
DELETE/TRUNCATE grants.

Left for the owner, in the dashboard (Auth → password settings; not a migration): turn on **leaked password
protection**.

`private.corpus_publishers` has RLS on and no policies on purpose: only the service role reads it (ADR 0009).
