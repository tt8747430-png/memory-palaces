# Web Push reminders and the due-count badge

Status: needs-triage
Type: task

From the old phase plan, not started.

1. A service-worker push handler and a permission flow; subscriptions stored in Supabase.
2. A scheduled sender for due reviews and streaks at risk, honouring quiet hours and preferences. `pg_cron` and `pg_net`
   are already enabled (history trim, account purge); reuse them.
3. The Badging API for the due count.

Done when reminders are opt-in and the badge shows the due count on an installed app (iOS 16.4+).
