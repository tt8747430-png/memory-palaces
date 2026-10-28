# 01 — Submit a bug from the app

Status: needs-triage
Type: task

The owner asked for a way to report a bug from inside the app. Nothing exists. Settings → Help is the likely home.

To decide: where a report goes (a Supabase table, an email, a GitHub issue through an Edge Function), what it carries
(a screenshot, the build, the device, the viewport probe's text), and whether it works offline (ADR 0004: it would be
queued like any write, since nothing needs an answer now).
