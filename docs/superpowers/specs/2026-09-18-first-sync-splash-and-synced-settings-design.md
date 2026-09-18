# First Sync under the splash, and settings that follow the account

Date: 2026-09-18 · Status: approved · Supersedes the "Autosync is a property of the device" decision of
`2026-09-15-offline-sync-and-account-lifecycle-design.md`

## 1. Why

- Signing in on a fresh device lands on an empty Library. The Realtime watcher starts on sign-in,
  but nothing pulls until Autosync fires on some later event or the learner taps Synchronise.
- Developer mode, Autosync and the Library's expanded rows live on the device. An admin who
  switches on dev mode on the phone does not have it on the laptop.

## 2. Decisions

| Question                           | Decision                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| When does the splash hold?         | While the signed-in account has never completed a Sync on this device (`syncState.lastSyncedAt === null`), and Autosync is on. Re-signing in where the decks already are goes straight in. |
| What if that Sync cannot finish?   | The splash lets the learner in: at once offline, on any outcome, and after at most 10 s. The banner says what happened, and Autosync pulls once it can (ADR 0004).                         |
| Which settings sync?               | Developer mode, Autosync, and the Library's expanded rows (deck ids) — into `Preferences`, which already syncs.                                                                            |
| Which stay on the device?          | The probe overlay and the keyboard-height measurement (both measure this device), and the theme mirror (a pre-paint copy of a setting that already syncs).                                 |
| How do two devices' settings meet? | Setting by setting: what a device changed since it last saw the server's copy wins; everything else comes from the server.                                                                 |

## 3. First Sync under the splash

**The rule.** The splash holds while the signed-in account has never completed a Sync on this
device — a fresh device, a device just cleared of another account's data, guest data about to join
an account, a relaunch after an earlier first Sync did not finish — and Autosync is on. With it off,
nothing leaves the device until the learner asks, so nothing runs by itself.

**What starts it.** `useFirstSync` (`app/providers`) runs the account's first cycle as soon as the
watcher is up for it. Every outcome ends it — landed, offline, failed, a question to answer — and so
does `FIRST_SYNC_BUDGET_MS` (10 s): past it the learner is let in and the cycle carries on under the
banner. A cycle that did not finish is not retried under the splash. When the preferences the first
cycle pulled switch an extension on, a second cycle brings that extension's rows in before the
splash lets go — "all the synchronisation" includes the Bible verses.

**It never covers a question.** Switching this device to another account with unsynced work asks
first. `useDataTransition` derives that question in render (`status`: `deciding` · `asking` ·
`settled`) rather than setting it from an effect, so the render that first knows the answer already
shows it, and the splash does not hold while it is asked. Answering **Sign out** closes the dialog at
once and cannot sign out twice.

**The splash store holds by reason.** `shared/lib/app-splash.ts` keeps a set of holds: `intro` (the
animation is playing), `boot` (services are being built), `session` (who is signed in, and whether
their first Sync is due, is not known yet), `first-sync`. The overlay shows while any is held.

- The app opens held by `intro`, `boot` and `session`. `useFirstSync` releases `session` once it
  knows, raising `first-sync` first, in a layout effect — so a cold launch never drops the splash and
  brings it back, and a sign-in never paints one frame of an empty Library. `SyncProvider` is told
  `auth: undefined` while the session is still being restored: not known is not signed out.
- Raising a hold while nothing is held also raises `intro`, so a splash that comes back plays its
  intro through rather than flashing.
- **Skip** releases `intro` and `first-sync` only: what is not decided yet cannot be skipped. While
  a first Sync is running the button reads **Open now**, since the intro is over.

**What the overlay says.** Once its intro has played and a first Sync is still running, a quiet line
— "Bringing in your decks…" — in a polite live region.

## 4. Settings that follow the account

**`Preferences` gains** `devMode: boolean` (default `false`), `autosync: boolean` (default
`true`) and `libraryExpanded: string[]` (deck ids, default `[]`). Its RxDB schema goes to version 4;
the migration adds the defaults, and `completePreferences` fills them for older rows sync pulls in.
The Supabase table stores the document as JSONB, so the server needs no migration.

**Consumers read Preferences, and the device-local paths are deleted:**

- dev mode — `useDevMode` / `readDevMode` / `setDevMode` and their localStorage flag go; readers use
  `selectDevMode`, writers `setPreferences`, and the extension route guard reads the preferences
  store once the runtime has settled on them.
- Autosync — `sync-state` loses `autosync` (schema version 2); `selectAutosync` moves to the
  preferences entity and `setAutosync` is `setPreferences`. The Sync page no longer says "on this
  device only".
- expanded rows — `usePersistedSet('mindscape.library.expanded')` goes; the Library shows a toggle at
  once through React's `useOptimistic`, and waits for Preferences before drawing its rows.

**`setPreferences` waits for the store to load.** An unloaded store reads as "nothing stored", and
writing then would save a fresh set of defaults over every setting the account has.

**Settings merge setting by setting.** A stale device's write must not undo a setting it never
touched — a device that switches on dev mode without having pulled the dark theme set elsewhere, or
one that expands a Library row. `push_documents` only compares document clocks, so a newer clock
would overwrite the whole document unmerged. So preferences sync with `refuseUnseenOverwrites`
(`shared/config/sync-tables.ts`): before a push, the server's copy is compared with the one this
device last saw, and one that moved on comes back as a conflict. `mergePreferencesConflict` then
merges it with `mergePreferences` (`entities/preferences`): what this device changed since it last
saw the server's copy — or, never having seen it, what differs from the defaults — it keeps;
everything else comes from the server; the later clock is kept.

**Nobody loses a choice already made.** `app/persistence/adopt-device-settings.ts` moves the old
dev-mode flag, the old expanded set and the old Autosync choice into Preferences — creating the
document if the device never stored one — and deletes the old keys only once the write has landed.
`createServices` awaits it; with nothing to move it returns at once, without waiting on the database.
The Autosync choice reaches it through `sync-state`'s migration, which is where the field is dropped:
it leaves a hand-off key (`AUTOSYNC_OFF_HANDOFF_KEY`) when the learner had switched Autosync off. A
migration alone would not do — it only runs on a document that exists.

## 5. Tests

- the splash store: holds, `intro` raised with the first hold, the opening `session` hold, Skip;
- `useFirstSync`: every outcome, a throw, the budget, Autosync off, a device that synced before, the
  second cycle for widened tables, a cold launch that never drops the splash, the question it never
  covers, sign-out mid-sync — and over the fake cloud through `SyncProvider`;
- `mergePreferences`, the preferences conflict handler, and `splitUnseenOverwrites`;
- `setPreferences` waiting for the store; the adoption keeper: each key, the missing document, the
  fast path, keys kept when the write fails; both schema migrations;
- Settings (dev mode), Sync, Extensions and the Library over Preferences.
