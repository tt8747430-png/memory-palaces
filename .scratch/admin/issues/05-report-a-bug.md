# 05 — Report a bug

Status: ready-for-agent
Type: task

The owner asked for a way to report a bug from inside the app. Piano-trainer only collects errors automatically; this
adds the learner's own report on the same path.

- Settings → Help: **Report a bug**: a sheet with a note (required) and an optional screenshot, sent with the build,
  the device, the route and the viewport probe's text.
- Stored beside error reports: `error_reports` gains `kind` (`error` | `report`) and `note`, or a sibling table if the
  cap and purge should differ (decide, say why in ADR 0011). A screenshot goes to a private bucket, path stored.
- Offline: the report waits on the device and is sent on reconnect; the sheet says so (ADR 0004: nothing needs an
  answer now).
- The Bug reports tab: newest first, the note, the screenshot, the device; mark one dealt with.
