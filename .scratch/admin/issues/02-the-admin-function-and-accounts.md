# 02 — The admin function and accounts

Status: ready-for-agent
Type: task

- `supabase/functions/admin/`, from piano-trainer: list accounts (search by email or name), set a role; checks the
  caller is an admin; writes `admin_log`.
- `AdminPort` in `shared/api/admin/` with a Supabase adapter and a fake for tests (piano-trainer's `types.ts`, minus
  reports and drafts). Every call returns a value; offline it fails with the reason (ADR 0004: the server must answer
  now).
- The Accounts tab: email, name, role, joined, last sign-in; change a role with a confirm. An admin can't demote the
  last admin.
