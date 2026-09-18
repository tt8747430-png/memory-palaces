# ADR 0004 — What needs the network

- **Status:** accepted · **Date:** 2026-09-15

The implementation is `SupabaseAuthGateway.signOut`, `features/session/sign-out.ts`, the `OfflineNotice` placements in
`widgets/threshold/ui/AuthForm.tsx`, `pages/forgot-password` and `pages/settings-change-password`, the gated Delete
account row in `pages/settings-profile` with `features/account/prepare-account-deletion.ts` and
`request-account-deletion.ts`, the scheduled-deletion check in `app/providers/AuthProvider.tsx`, and the offline branch
of `features/sync/sync-now.ts`. Each carries the reasoning per call site; this records the rule they all follow.

## Context

Mindscape studies offline by design. The temptation, when an audit finds a screen that fails without a connection, is
to gate it. That reflex is wrong more often than it is right: most of the app is _supposed_ to work offline, and a
readiness gate added to an offline-first write is a regression dressed as a fix.

Two rounds of auditing produced both kinds of finding — real gaps (a sign-in that failed into a "Failed to fetch"
toast) and proposed gates that would have broken working features. So the test has to be written down.

## Decision

The test is **not** "does this eventually reach the server". Nearly everything does. The test is:

> **Must the server answer _now_ for this action to be correct?**

If yes, gate it before the press with `OfflineNotice` and a disabled control. If no, never gate it: the device decides,
and Sync carries the decision later.

### Needs the network — gate before the press

Sign in · sign up · OAuth · password-reset email · password change (it re-authenticates) · requesting account deletion.

Every one of these is a question only the server can answer. A password change that "succeeded" offline would be a
lie: nothing was re-authenticated and no credential changed.

### Never gated

Every write to decks, folders, cards, questions, reviews, progress, preferences, profile. Creating, renaming,
reordering, archiving, deleting — all of it. The device is authoritative and a Sync carries the write later: a write to
a deck, folder, card or question also records a **pending change**, so the banner can count it and a Sync can tell
whether a deletion clashes with another device; progress, preferences and profile always merge, so they need no log.

Deleting a deck also removes its cover image from storage — best-effort, and silently skipped offline. The object is
not worth a gate: the account purge empties the whole prefix anyway.

A deletion made offline is not a special case. It is a decision the user made on a device that holds the data, and it
is as valid as a rename.

### Never gated and never synced

Notifications, `pendingChanges` and `syncState`. These are device-local: they record no pending change because they
have nowhere to go, and the device's own bookkeeping about the cloud cannot itself be in the cloud. The learning
history was in this category until it gained a mirror table; it is synced now, but still records no pending change,
because an entry is never edited and so can never diverge.

### The first Sync holds the splash — bounded

An account's first Sync on a device (never completed one here: a fresh device, one just cleared of another account,
guest data joining an account) runs by itself and holds the splash, so the learner lands on their decks rather than an
empty Library. It is the one wait on the network besides the scheduled-deletion check, and it is bounded the same way:
offline it releases at once, every outcome releases it, and past `FIRST_SYNC_BUDGET_MS` (10 s) the learner is let
in while the cycle carries on under the banner. **Open now** lets them in sooner. With Autosync off it does not run at
all — nothing leaves the device until the learner asks. Nothing is gated: the learner is only kept from an empty
screen, never from a write.

### Synchronise is not gated — it declines

A Sync is not an action that has to succeed when pressed; it is the device catching the cloud up. Offline, `syncNow`
returns `offline` before any request, nothing is touched, and the banner states how many changes are waiting instead of
offering a button that cannot work. Autosync simply does not run until the browser is back online.

### Neither — images

**Upload:** saved inline immediately, moved to storage when there is a network. `uploadInlineImage` returns `null`
rather than throwing precisely so this stays true. Gating it would break a feature that is already correct offline.

**Read:** never the network. The buckets are private, so bytes need a signed URL — and minting one during render would
put a round-trip in front of every deck cover. `keepImagesCached` fetches ahead of the read whenever the network allows,
and `useImageSrc` reads only that cache; until it lands the cover shows its colour and icon.

### Signing out is local, always

`auth-js` removes the stored session and _then_ tries to revoke the refresh token, returning the transport failure
either way. Treating that failure as fatal left the app signed in with no session behind it — unusable, and with no way
out. So `signOut` swallows `isAuthRetryableFetchError` and `features/session/sign-out.ts` clears the session store in a
`finally`. A non-network `AuthError` still reaches the caller, and the store is still cleared.

## Three findings this ADR exists to refuse

An audit proposed gating each of these. All three were checked and all three were already correct:

- **`import-review`** reads only its own local draft store. It never touches a gateway, so it needs no readiness gate.
- **The avatar upload** handles offline deliberately — `uploadInlineImage` never throws, and the inline value is a
  waypoint `reconcileInlineImages` moves out at the next connected moment. A gate would have broken an offline-first
  feature.
- **Account deletion** touched no gateway at all, which was precisely the bug: it wiped local stores and blanked the
  profile, and those writes replicated. It needed _fixing_, not gating — and the fix then put it in the first category,
  because the request must reach the server. It now also syncs before it wipes, and stops if that sync fails.

A future audit that proposes gating any of them is wrong, and this is why.

## Consequences

- Offline, the two auth screens show a notice and a disabled submit; **Continue as guest** stays live, because that
  decision is the device's alone.
- Sign-out can no longer strand a session.
- **Requesting account deletion** is gated at the row, then Synchronises before it asks for the typed confirmation, and
  Synchronises again before it wipes — the device is only erased once the cloud holds everything on it.
- **The scheduled-deletion check on sign-in** is the one network read that holds the app back, and only for a bounded
  moment (`AuthProvider`, `CHECK_BUDGET_MS` = 4 s). Offline or slow, the app opens and the check retries on reconnect:
  requesting deletion signs every device out, so the only way to hold a session on a scheduled account is to sign in,
  which needs the network the check then has.
- **Signing into a different account** is not gated, but it is not silent either: when the device holds changes the
  previous account never synchronised, it asks before erasing them and offers to sign back out instead.
- The rule is the thing to cite in review. "It eventually hits the network" is not an argument for a gate.
