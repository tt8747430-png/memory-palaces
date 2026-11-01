# 01 — Roles and the first admin

Status: ready-for-agent
Type: task

- Migration: `is_admin()`, `admin_bootstrap` and its `bootstrap_admin` trigger, from piano-trainer's
  `20261029160000_admin.sql` (only the role parts; no `editor`). Grants revoked as in its `harden_grants`.
- `entities/session`: the account carries `role: 'admin' | 'learner'`, read from `app_metadata.role` (piano-trainer's
  `roleOf`). A guest is a learner.
- After applying, the owner adds their address to `admin_bootstrap` from the SQL editor (it never enters the repo).
- Tests: the role read from a session, and a guest; the migration in the Supabase integration suite.
