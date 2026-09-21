# 13 — Review ThemeProvider and the notification path
Status: resolved
Type: research

`app/providers/ThemeProvider.tsx` (data-theme + localStorage mirror) · EventBus → `NotificationBridge` →
notification store + sonner. Deliverable: findings list.

## Answer (review findings)
There is no separate "theme manager": the theme is `preferences.theme` → `PreferencesProvider` → `ThemeProvider`
(`useLayoutEffect`, sets `data-theme`, mirrors to `localStorage['mindscape:theme']`) + the inline script in
`index.html` that reads the mirror before first paint. That part is sound (no flash, no effect-derived state).

Findings, by weight:
1. **Toasts follow the OS, not the app.** `<Toaster theme="system">` (`AppProviders.tsx`) resolves against
   `prefers-color-scheme`; a learner on "dark" in-app over a light OS gets light toasts. Fix: `ThemeProvider`
   publishes the resolved theme (context), `Toaster theme={resolved}`.
2. **`<meta name="theme-color">` follows the OS too** (`index.html` lines 11–12, media-query pair). Status bar
   mismatches the in-app theme. Fix: one meta, `apply()` sets its `content` from the resolved theme's `--bg` ink.
3. **The "Notifications" toggle silences 4 of 79 toasts.** Only `useStudySessionReward` reads
   `preferences.notifications`; the other 30 files toast unconditionally. Decide what the toggle means (reward
   toasts only — then rename it — or every non-error toast — then gate at one seam, e.g. a `notify()` in
   `shared/lib` that reads the preference, with `toast.error` exempt).
4. **The bell fills up while toasts are off.** `NotificationBridge` records level-up/streak/quiz regardless of
   the toggle. Probably right (it is history, not interruption) — confirm, and say so in a comment.
5. **`richColors`** paints toasts from sonner's palette, not the app tokens; the green "Card style applied"
   toast is sonner's green. `toastOptions.classNames` → `--success-surface`/`--danger-surface` would keep one
   language. Cosmetic.
6. Notifications are device-local by design (no `pending` port, no server table) — matches CLAUDE.md; fine.
7. `recordNotification` prunes with sequential awaits; cap 40, at most one overflow per record → fine.
