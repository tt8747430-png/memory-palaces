# 01 — Check for updates by hand

Status: ready-for-agent
Type: task

The owner asked for a way to check whether a newer version of the app is out.

Today `app/providers/UpdatePrompt.tsx` registers the service worker (`registerType: 'prompt'`), checks every 15
minutes, on focus and on reconnect, and shows a toast with Reload when a new worker waits. The learner can't ask for a
check, and can't tell whether the app is current.

Build:

1. **Settings → About:** a "Check for updates" row under Version.
2. **The check:** a tap runs the same `reg.update()` the timer runs. Lift `registerOnce` out of `UpdatePrompt` into a
   small module both use, so there is one registration and one waiting-worker watcher.
3. **The row's states:** checking, up to date, an update ready (with Reload, the toast's same `activateWaitingWorker`
   path), and a failed check.
4. **Offline:** the row is disabled and says why (ADR 0004: gate only what the server must answer now).
5. **Version:** the shown version comes from the build (`package.json` version injected by Vite), not a hardcoded
   string in the locale. This ties to release-1.0 issue 02.
6. **i18n:** keys in `shared/i18n/locales/en/settings.ts`.
7. **Tests:** the row's four states and the offline gate, with a fake registration.
