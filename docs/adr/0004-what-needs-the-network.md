# ADR 0004 — What needs the network, and the account's life

- **Status:** accepted · **Date:** 2026-09 · consolidated 2026-10

The call sites carry the reasoning: `SupabaseAuthGateway.signOut`, `features/session/sign-out.ts`, the `OfflineNotice`
in `widgets/threshold/ui/AuthForm.tsx`, `pages/forgot-password`, `pages/settings-change-password` and the Delete
account sheet, `features/account`, the scheduled-deletion check in `app/providers/AuthProvider.tsx`, and the offline
branch of `features/sync/sync-now.ts`. When a Sync runs and what it carries is [ADR 0005](0005-sync.md).

## Context

Mindscape studies offline by design. When an audit finds a screen that fails without a connection, the reflex is to
gate it, and that reflex is wrong more often than right: a gate on an offline-first write is a regression dressed as a
fix. Two audits produced both kinds of finding, real gaps (a sign-in that failed into a "Failed to fetch" toast) and
proposed gates that would have broken working features.

## Decision

The test is not "does this eventually reach the server". It is: **must the server answer now for this action to be
correct?** If yes, gate it before the press with `OfflineNotice` and a disabled control. If no, never gate it.

- **Gated:** sign in, sign up, OAuth, the password-reset email, a password change (it re-authenticates), requesting
  account deletion. Each is a question only the server can answer.
- **Never gated:** every write to decks, folders, cards, questions, reviews, progress, history, preferences, profile.
  The device decides and a Sync carries the decision later. A deletion made offline is as valid as a rename.
- **Never gated, never synced:** notifications, `pendingChanges`, `syncState`. They are device-local.
- **Synchronise declines rather than gates.** Offline, `syncNow` returns `offline` before any request and the banner
  states how many changes are waiting. Autosync waits for the browser to be back online.
- **Images are neither.** An upload is saved inline at once and moved to storage when there is a network
  (`uploadInlineImage` returns `null` rather than throwing). A read never touches the network: `keepImagesCached`
  fetches bytes ahead of the read and `useImageSrc` reads only that cache; until then a cover shows its colour and
  icon. Deleting a deck removes its cover from storage best-effort and skips it silently offline.
- **Signing out is local, always.** `auth-js` removes the stored session and then tries to revoke the token,
  returning the transport failure either way. `signOut` swallows `isAuthRetryableFetchError`, and `sign-out.ts`
  clears the session store in a `finally`. A non-network `AuthError` still reaches the caller.
- **Two waits may hold the app, both bounded.** The scheduled-deletion check on sign-in (`CHECK_BUDGET_MS`, 4 s) and an
  account's first Sync on a device (`FIRST_SYNC_BUDGET_MS`, 10 s, ADR 0005). Offline, both let the learner in at once.

**Account deletion has a 30-day grace.**

- Requesting it is gated at the row. It Synchronises first (`prepareAccountDeletion`) and stops, with a retry, if that
  fails: the only reason to wipe the device is that the cloud holds everything. A destructive divergence opens the
  review dialog. Then the typed confirmation, naming the purge date. `requestAccountDeletion` Synchronises once more,
  calls the `request-account-deletion` Edge Function (which records `purge_after = now() + 30 days` and signs every
  device out), signs out and wipes the device.
- Signing in to a scheduled account shows "Scheduled for deletion on <date>" with **Cancel deletion** and **Sign out**
  (`ScheduledDeletionGate`). Cancelling deletes the schedule and forces one restoring Sync whatever Autosync says,
  with the banner in its Restoring state. The app opens as soon as the cancel lands.
- A daily `pg_cron` job calls `purge-account` for every account past `purge_after`: empty both storage prefixes a page
  at a time, hard-delete the user's rows from every mirror table, then delete the auth user, which removes the
  schedule by cascade. Any failed step leaves the account scheduled and the next run retries.

## Consequences

- Offline, the auth screens show a notice and a disabled submit. **Continue as guest** stays live.
- Sign-out can't strand a session.
- Signing into a different account is not gated, but when the device holds changes the previous account never
  synchronised, it asks first (`UnsyncedResetDialog`): **Erase and continue** or **Sign out**.
- Three findings an audit proposed to gate, all already correct, and why a future audit is wrong to propose them
  again: `import-review` reads only its own local draft; the avatar upload is offline-tolerant by design; account
  deletion needed fixing (it wiped and blanked local stores, and those writes replicated), not gating.

## History

- Sign-out awaited the token revoke, so offline it threw and left the app signed in with no session (fixed 2026-09).
- "Delete account" wiped local stores and blanked the profile; nothing on the server was deleted, and the blanking
  replicated (replaced 2026-09).
