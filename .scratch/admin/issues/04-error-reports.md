# 04 — Error reports

Status: ready-for-agent
Type: task

- Migration: `error_reports` with its cap and nightly purge, from piano-trainer's two migrations. `pg_cron` is already
  on here.
- The reporter (piano-trainer's `shared/api/errors/`): a route's error screen and an uncaught error or rejection, once
  per message a run, ten a run at most, with the path, the build and the user agent. supabase-js loads lazily, so this
  must not pull it into the entry graph (`npm run check:entry-graph`).
- The Errors tab: newest first, the message, where, which build; the stack on open.
