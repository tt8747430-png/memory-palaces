# 01 — What the Notifications toggle silences

Status: needs-triage
Type: grilling

From the 2026-09 review of the notification path. `preferences.notifications` is read in one place,
`use-study-session-reward.ts`, so the toggle silences the study reward toasts and nothing else.

- Decide what the toggle means: reward toasts only (then rename it), or every toast but errors (then gate at one seam,
  a `notify()` that reads the preference, `toast.error` exempt).
- `NotificationBridge` records level-ups, streaks and quiz results in the bell whatever the toggle says. Probably
  right, since the bell is history; confirm and say so in a comment.
- `richColors` paints toasts from sonner's palette, not the app's tokens. `toastOptions.classNames` mapped to the
  status surfaces would keep one look.
