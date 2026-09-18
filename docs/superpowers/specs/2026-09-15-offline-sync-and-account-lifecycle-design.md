# Offline sync and the account lifecycle

Date: 2026-09-15
Status: **implemented** — all seven slices shipped on `main`
Revision: 3 — updated to match the code as built, after a second two-axis review found places where the design itself
was wrong (the purge order, checkpoint advancement, a Delete answer losing to the edit it overrules). Where this text
and the code disagree, the code and its tests are right and this document is the bug.

## Why this exists

Mindscape studies offline by design, and the parts of it that already work offline work well: RxDB is
the source of truth, `push_documents` refuses to apply a stale row, and the conflict handlers merge
field by field so neither device loses a review. What is missing sits at the edges of that model.

Four things were wrong when this was written (every one is fixed now; the descriptions are kept as the
reason for the design):

1. **Sync is invisible and involuntary.** Replication is `live: true`. The user is never told what is
   pending, never asked before a deletion made offline propagates, and has no way to say "not yet".
2. **Sign-out can strand a session.** `SupabaseAuthGateway.signOut` awaits a revoke; offline,
   `auth-js` removes the local session _and still returns the error_, so `fail()` throws and
   `sign-out.ts` never reaches `sessionStore.clear()`. The Supabase session is gone, the app still
   believes it is signed in.
3. **"Delete account" deletes no account.** `use-delete-account.ts` wipes local stores and blanks the
   profile. Those writes replicate, so the server row is blanked and the content tombstoned — but the
   `auth.users` row survives, the email stays taken, and the user stays signed in.
4. **Images are world-readable.** The `deck-images` and `avatars` read policies are
   `using (bucket_id = ...)` with no owner predicate. Every avatar and deck cover is fetchable by
   anyone holding the URL. Nothing ever deletes an object, either — `SupabaseStorage.remove` exists
   and has no callers.

Alongside them, two architectural debts and a cleanup pass that the same work should absorb rather
than leave for later.

## Scope

Seven slices, in this order. Each lands green (`npm run typecheck && npm run lint && npm run test`)
before the next begins.

**B → A → F → C → D → E → G**

|     | Slice                              | Why here                                           |
| --- | ---------------------------------- | -------------------------------------------------- |
| B   | Composition root goes async        | Everything below edits it; do it once              |
| A   | Auth truth and network gating      | Small, independent, unblocks honest sign-out       |
| F   | Manual sync, banner, review dialog | The model change; C/D/E build on the settled shape |
| C   | Storage privacy and orphan cleanup | Schema migration, adjacent to F's schema additions |
| D   | History sync                       | Adds a table to an already-settled cycle           |
| E   | Real account deletion with grace   | Cannot delete everything until C and D exist       |
| G   | Monolith decomposition and Lexend  | Collides with every edit above; goes last          |

## Decisions taken

Settled during design; the implementation plans do not reopen them.

- **Merges stay.** `mergeCard` and `mergeProgress` lose nothing and keep running. The user is asked
  only where a merge genuinely cannot decide, and only when the cloud has actually moved: a document
  deleted here and edited there, or a deck or folder deleted here whose descendants were edited
  there. A deletion pushed to a cloud that has not changed is never a question, however large.
- **Sync is manual.** Nothing leaves the device until the user asks, or until Autosync is on.
- **Autosync defaults to on, and is a property of the device, not the account.** _Superseded 2026-09-18: Autosync is
  a preference and follows the account, and an account's first Sync on a device runs by itself — see
  `2026-09-18-first-sync-splash-and-synced-settings-design.md`._ It was specified
  off, and the reason it is not is the risk that reasoning named: a device lost or reinstalled
  before the user presses Synchronise loses everything since the last press. Defaulting on closes
  that gap by default and leaves the decision where it was — one device-local toggle, reaching no
  other device and no part of the account. Nothing else about manual Sync changes: there is still
  no continuous replication, a cycle still runs only at the moments `useAutosync` names, and a
  destructive divergence still interrupts to ask. The banner is still permanent, because a device
  with Autosync off has the same gap as before.
- **Account deletion gets a 30-day grace period**, cancellable by signing in.
- **Buckets go private and image bytes are cached ahead of the read**, so privacy costs neither
  offline rendering nor the "reads never touch the network" rule.

## Superseded during design

Recorded so a plan author does not reintroduce them.

- **"Overwrite the cloud" / "take the cloud" as a whole-dataset choice.** Asked for early, then
  replaced by the user's own later description of a banner-driven manual sync. It is not in this
  spec, deliberately: overwriting the cloud wholesale destroys another device's work with the user
  unable to see what they are destroying, and taking the cloud wholesale discards everything done
  offline. The per-item review dialog covers the case those actions were reaching for.
- **Autosync on `preferences`.** `preferences` is in `SYNCED_TABLES`, so storing Autosync there would
  turn it on for every device at once and silently void "sync is manual". It lives on the
  device-local sync state instead, and `preferencesSchema` is not touched by this work.

## Ubiquitous language

Slice F edits `docs/UBIQUITOUS_LANGUAGE.md` to add these; the spec does not own them alone.

- **Sync** — one full peek-then-apply-then-push cycle. Never a study pass, never a login.
- **Synchronise** — the user-facing verb on the banner button.
- **Autosync** — the setting that runs Sync without being asked (a preference since 2026-09-18).
- **Pending change** — one recorded write not yet confirmed by a Sync. They live in `pendingChanges`.
- **Divergence** — the cloud and the device both changed since this device's last Sync. Distinct from
  RxDB's **conflict**, which is one document arriving with two versions and is settled by a
  `conflictHandler` without anyone being asked. Every conflict is inside a divergence; most
  divergences contain no conflict at all.
- **Destructive divergence** — a divergence no merge can settle. The only thing that opens a dialog.
- **Purge** — the irreversible server-side destruction of an account, 30 days after the request.

---

## Slice B — the composition root goes async

### Decision

`createServices()` returns a promise and stops pulling RxDB and Supabase into the entry graph. The
splash moves above the services boundary so it can cover the wait it is already covering by accident.

### Mechanism

`src/app/composition-root.ts`:

- `export async function createServices(): Promise<Services>`; the module-level
  `export const services = createServices()` is deleted.
- The static imports of `rxdb/plugins/storage-dexie`, `./persistence/database` and
  `@/shared/api/supabase` become `await import(...)` inside the function. Type-only imports stay
  static — `verbatimModuleSyntax` erases them, so they cost nothing at runtime.
- Everything else is unchanged, including the `start()` loop and the keepers.

`src/main.tsx` renders a new `src/app/Bootstrap.tsx`:

- Paints `SplashOverlay` on the first frame, before any service work.
- Calls `createServices()` in an effect, holds the result in state.
- Renders `<App services={services} />` once resolved.
- Lifts the splash when **both** its animation has finished and services have resolved, so a fast
  device does not flash and a slow one does not show a blank screen.
- A rejected `createServices()` renders a terminal error screen with a reload action. This is the one
  failure the app cannot recover from; it must not show an empty shell.

`src/app/providers/AppProviders.tsx` takes `services` as a prop instead of importing the singleton.
`src/app/RootLayout.tsx` keeps its `inert` gating and reads the same `useSplashStore`, but no longer
renders `SplashOverlay`.

**As built:** the router can no longer import `services` either, so `src/app/router.tsx` exports
`createAppRouter(services)` over `createRootRouteWithContext<RouterContext>()`, and `App` builds one
router per object graph. `Bootstrap` memoises the `createServices()` promise at module scope, because
StrictMode's double effect would otherwise open the database twice.

### Proving it worked

There is no build-output check in this repo today — `package.json` has `dev`, `build`, `preview`,
`typecheck`, `test`, `test:watch`, `test:cov`, `lint`, `format`, and Vitest only looks at
`src/**/*.{test,spec}.{ts,tsx}`. So this slice adds one: `scripts/check-entry-graph.mjs`, wired as
`npm run check:entry-graph`, asserting that `dist/index.html` emits no `modulepreload` for the
persistence or supabase chunks. Without it the slice's only claim is unverifiable.

### Testing

- `Bootstrap` renders the splash before services resolve, the app after, and the error screen on
  rejection.
- `npm run build && npm run check:entry-graph` passes.
- Existing tests are unaffected: they wire their own stores through `src/shared/test/started.ts` and
  never import `services`.

---

## Slice A — auth truth and network gating

### Decision

Sign-out always succeeds locally. Actions the server must answer _now_ are gated before the press;
actions the device can decide alone are never gated.

### Mechanism

`src/shared/api/supabase/supabase-auth-gateway.ts` already imports `isAuthRetryableFetchError` from
`@supabase/supabase-js` and already uses it inside `fail()` to raise `AuthError(..., 'network')`.
Nothing new is added; `signOut` simply stops treating that case as fatal:

```ts
async signOut(): Promise<void> {
  this.forgetGuest()
  const { error } = await this.client.auth.signOut()
  // auth-js removes the local session even when the revoke cannot reach the server, and the local
  // session is the part this device needs gone. Rethrowing would leave the app signed in with no
  // session behind it.
  if (error && !isAuthRetryableFetchError(error)) fail(error)
}
```

The scope stays `'global'`. An earlier draft switched to `'local'` when offline; that buys nothing —
`auth-js`'s `_signOut` issues the same `admin.signOut(accessToken, scope)` fetch for both scopes, so
offline it fails identically. Keeping `'global'` means the refresh token is genuinely revoked
whenever the network allows it.

`src/features/session/sign-out.ts` clears the session store in a `finally`, so no gateway outcome can
leave the app signed in locally.

`src/widgets/threshold/ui/AuthForm.tsx` already computes `online` for the social buttons'
`unavailableReason`. It extends to the email submit: disabled offline, with `OfflineNotice` above the
form — the shape `ForgotPasswordPage` already uses.

### What sign-in gets, precisely

`signInWithEmail` is correct as written: it awaits the gateway and writes the session. This slice
changes exactly one thing about sign-in — it is gated offline instead of failing into a toast. Slice
E adds the second thing: a sign-in that lands on an account scheduled for deletion is intercepted
before the app opens. There is no third defect in sign-in; it is named here so the plan does not go
looking for one.

### The rule, written down

New `docs/adr/0004-what-needs-the-network.md`. The test is **not** "does it eventually reach the
server" but **"must the server answer now for this action to be correct"**.

- **Needs the network** — sign in, sign up, OAuth, password reset email, password change
  (re-authentication), requesting account deletion. Gate before the press.
- **Never gated** — every write to decks, folders, cards, questions, reviews, progress, preferences.
  The device decides; Sync carries it later.
- **Never gated and never synced** — notifications and, until Slice D, the learning history. These
  are device-local; they record no pending change because they have nowhere to go.
- **Neither** — image upload. Saved inline immediately, moved to storage when there is a network.
  `uploadInlineImage` returns `null` rather than throwing precisely so this stays true.

The ADR records the three findings that prompted it: `import-review` reads only a local draft store,
the avatar upload is deliberately offline-tolerant, and account deletion needed fixing rather than
gating. A future audit that proposes gating any of them is wrong, and the ADR says why.

### Testing

- `signOut` offline: local session cleared, no throw, session store cleared.
- `signOut` with a non-network `AuthError`: rethrows, session store still cleared.
- `AuthForm` offline: email submit disabled, notice shown.

---

## Slice F — manual sync

### Decision

Replication becomes user-initiated. A permanent banner shows what is pending. A dialog appears only
for destructive divergence.

### Two new entity slices

Both follow the shape CLAUDE.md fixes for entities — `model/types.ts`, `model/store.ts`,
`model/selectors.ts`, `model/context.ts`, `index.ts` — and both are device-local, never in
`SYNCED_TABLES`.

**`src/entities/pending-change/`** — a collection store over `pendingChanges`:

```ts
type PendingChange = {
  id: string // `${contentCollection}:${entityId}`, built by contentKey (shared/config/sync-tables)
  // Not `collection`: RxDB assigns that onto every document instance, and a schema field by the
  // same name shadows the assignment with a getter, so the document throws on construction.
  contentCollection: ContentCollection // 'decks' | 'folders' | 'cards' | 'questions'
  entityId: string
  op: 'save' | 'remove'
  at: string
}
```

Repeated edits to one document collapse onto one entry, with `op` and `at` overwritten. A save after
a remove replaces the remove, and vice versa — the log records the document's _net_ state relative to
the last Sync, not its history. Selectors: `selectPendingCount`, `selectPendingByCollection`,
`selectPendingRemovals`.

**`src/entities/sync-state/`** — a singleton store, the device's own sync bookkeeping:

```ts
type SyncState = {
  id: 'sync-state'
  checkpoints: Partial<Record<SyncedTable, Checkpoint | null>> // no required keys: a new table needs no migration
  lastSyncedAt: string | null
  autosync: boolean // true for a new device; v1 migrates a stored false, see database.ts
  cloudChanged: boolean
}
```

Autosync lived here rather than on `preferences` because it was a property of _this device_. _Superseded 2026-09-18:
it moved to `preferences`, and `syncState` v2 drops the field._
`preferencesSchema` is not touched.

### What records a pending change

`src/shared/lib/entity-store.ts` is the single choke point: every write passes through `mirrorSlice`'s
`save` or `createCollectionStore`'s `remove`. Both append through an **optional** `PendingChangePort`
the composition root injects — passed as `createCollectionStore(key, repo, compare, { pending, complete })`,
where `complete` is the read-side repair Slice C needs (`completeDeck`). The port is built by
`features/sync/create-pending-change-port.ts` with the collection already bound, and records only after
the write lands. A port rather than a direct write, because `entity-store` is generic
over every slice and must stay ignorant of any particular collection, and because a test then
supplies a fake instead of a database.

**Only the four content stores get a port** — decks, folders, cards, questions. Progress, preferences
and profile are singletons that always merge and can never diverge destructively; notifications,
history and the two new bookkeeping collections are device-local. So the log holds exactly what the
banner counts and exactly what the classifier examines, and there is no hidden filter anywhere.

The log does not drive the push — RxDB's own push checkpoint does that. The log exists to answer two
questions: _how many changes are pending_ and _which of them are destructive_.

### Schema

`pendingChangeSchema` and `syncStateSchema`, both version 1, in `src/app/persistence/schemas.ts`,
registered in `src/app/persistence/database.ts` with RxDB's default conflict handler like
`notifications` and `history`. `pendingChanges` v1 renames `collection` to `contentCollection` and
migrates the rows, because a device that ran v0 holds entries it could never read back.
`syncState` v1 sets `autosync` to true, because the default moved from off to on and a default is
only ever read by a device that has never stored a document. A device new to both simply starts
with an empty log and null checkpoints. That reads as "nothing pending, cloud position unknown",
which the first Sync resolves by peeking from the epoch — wrong only until that Sync, and wrong in
the safe direction.

### Peeking without RxDB

RxDB owns its replication checkpoint and applies every row it pulls; `RxReplicationState` exposes
only `reSync`, `awaitInSync` and `cancel`. There is no "pull but do not apply" mode, and `live: false`
does not create one. An earlier draft specified that mode; it does not exist.

So the peek goes around RxDB, using the pure functions replication.ts already exports and tests:

`src/shared/api/supabase/peek.ts`

```ts
export async function peekRemoteChanges(
  supabase: SupabaseClient,
  table: string,
  checkpoint: Checkpoint | null,
): Promise<RemoteChange[]> // { id, updated_at, deleted } — ids only, never `data`
```

It reuses `buildPullFilter(checkpoint)` verbatim, which is why the keyset pagination and its
same-transaction tie-break come along for free. It selects `id, updated_at, deleted` and not `data`,
so the peek stays cheap even after a month offline. The checkpoint it reads is _our_ checkpoint, on
`syncState` — independent of RxDB's, and advanced only when a Sync completes.

**As built,** the cloud is one port, `CloudSyncPort` in `shared/api` — `peek`, `parents`, `fetch`,
`runCycle` — so `syncNow` runs end to end in tests without a project. `parents(table, ids)`
(`fetchRemoteParents`) selects only `data->>deckId`, `data->>parentId` and `data->>folderId`: it is what
answers "whose child is this" without pulling content. The Supabase adapter is
`createSupabaseCloudSync(supabase, manager)`; `SyncManager` itself owns only the watcher and the cycle.

### The cycle

`src/features/sync/sync-now.ts` — a feature command, because it writes:

1. **Peek.** `peekRemoteChanges` per synced table.
2. **Classify** each remote change against `pendingChanges`:
   - not in the log → **clean pull**;
   - in the log as `save`, changed in the cloud too → **mergeable**, RxDB's `conflictHandler` settles
     it;
   - in the log as `remove`, **deleted** in the cloud too → **clean**: both sides agree;
   - in the log as `remove`, edited in the cloud since → **destructive**;
   - in the log as `remove` for a deck or folder under which another device added or edited documents
     this device has never seen → **destructive**, because the deletion takes work the other device
     did with it. Found by `parents` over the unseen ids, walked to any depth (`descendantsOf` in
     `shared/lib/sync-divergence.ts`), and reported on the container as `descendants` rather than as
     questions of their own. Children that _were_ on the device went with the container
     (`deleteDeck` takes subdecks, cards **and questions**), so an edit to one of those is already a
     question in its own right.

   A deletion with no matching remote change is **not** destructive, however large. If the cloud has
   not moved, the device is the only author and its deletions push silently.

3. **Decide.** No destructive entries → straight to apply. Otherwise return `needs-review` carrying
   the set; the caller resolves it and calls back in.
4. **Apply and push.** `SyncManager.runCycle()` starts the replications (`live: false`), calls
   `reSync()`, awaits `awaitInSync()`, then cancels. RxDB applies pulls, runs the conflict handlers,
   and pushes through `push_documents` exactly as it does today. **Two things the first draft missed:**
   RxDB retries a failed push or pull forever and reports it only on `error$` — `awaitInSync()` has no
   error path — so the cycle races every replication's `error$` and rejects on the first error; and
   the cycle resolves with the ids its push carried (`PushedIds`).
5. **Confirm.** Clear the pending changes the push acknowledged (by `at`, so a write made during the
   cycle stays pending), stamp `lastSyncedAt`, and advance the checkpoints — **not** simply "to the
   highest `(updated_at, id)` the peek saw", which is what the first draft said. The push stamps every
   row it writes with a fresh server clock, so a checkpoint left at the first peek reports the device's
   own work as news on the next Sync and on the Realtime echo. So the table is peeked once more from
   where the first peek stopped, and the checkpoint steps forward only through rows this cycle pushed
   (`stepOverOwnEcho` in `features/sync/divergence.ts`). It stops at the first row it did not push —
   another device's, never classified — and `cloudChanged` is set exactly when some table stopped short.
   The save re-reads `syncState` first, so an Autosync toggle made during the cycle survives.

`SyncOutcome` is a discriminated union — `'clean' | 'merged' | 'needs-review' | 'offline' | 'failed'`
— and every caller handles all five. There is no default branch. It lives in `shared/lib/sync-runner.ts`
beside `SyncRunner`, so widgets and pages can switch on it without importing a feature.

A Sync that fails at any phase leaves the log and the checkpoints untouched, so the banner stays
accurate and the next attempt starts from the same place.

### Who owns Realtime

Today the channel is created _inside_ `createCollectionReplication`, with a `crypto.randomUUID()`
topic so two concurrent replications cannot collide. With `live: false` the replication exists only
during a cycle, so a channel inside it would be torn down between syncs and miss exactly the events
the banner needs.

The channel moves out into `src/shared/api/supabase/cloud-watcher.ts`:
`createCloudWatcher(supabase, tables, userId, onCloudChanged)`, subscribed for as long as an account
is signed in and owned by `SyncManager`. `createCollectionReplication` loses its channel and its
`pullStream$` entirely, and with them the random-topic workaround — the watcher is a single
long-lived subscription, so nothing collides.

The watcher never applies anything. It reports `{ table, id, updated_at }`, and
`features/sync/note-cloud-change.ts` raises `syncState.cloudChanged` only when that position is past this
device's checkpoint — the echo of this device's own push is not news. `SyncProvider` ignores events while
a Sync is in flight; the confirmation peek decides those.

### Feature commands

Every write in this slice is a feature, per CLAUDE.md. `src/features/sync/`:

- `sync-now.ts` — the cycle above.
- `find-review-items.ts` — classification alone, no cycle: what "Review pending changes" opens.
- `keep-cloud-copy.ts` — writes the cloud document back into the local collection (un-deleting it,
  with the cloud's own clock) and drops its pending change. For a deck or folder it restores the
  subtree the deletion took with it — every locally deleted child the cloud still holds — or a kept deck
  would come back empty.
- `apply-pending-deletions.ts` — applies every answer as a real write, then runs `syncNow` with those
  documents (and their descendants) marked **answered**, so the same question cannot come straight back
  while anything new still gets asked. A **Delete** answer re-deletes the document now: the original
  tombstone is dated before the other device's edit, so pushed as it stood it lost the merge and the
  document came back. The container's unseen descendants are tombstoned too, so they do not arrive as
  orphans.
- `note-cloud-change.ts` — the watcher's side, described above.
- `set-autosync.ts` — writes `syncState.autosync`.
- Internal modules, not commands: `divergence.ts` (peek, classify, checkpoint stepping),
  `content-collections.ts` (the one table mapping a content collection to its store, rows and label).

All exported from `src/features/sync/index.ts`. Widgets read through selectors and call these.

### Resolving a destructive divergence

`SyncReviewDialog` (`src/widgets/sync/ui/SyncReviewDialog.tsx`) groups by entity kind, names the real
deck, folder, card or question, and defaults each row to **Delete** — the user's own recent intent —
with **Keep** as the deliberate override. Two actions: _Apply_ and _Keep everything_. Fetching the
`data` for the rows under review is the one place the full row is pulled, and only for those ids.

Dismissing the dialog cancels the Sync entirely. Nothing is half-applied.

**As built:** every row is a `SegmentedControl` (≥ 44px); a container row states how many things
another device added or changed inside it; the sheet has a loading state, an error state with retry when
the rows cannot be fetched, and an empty state ("the deletions simply stand") when the cloud no longer
holds any of them. The dialog is mounted once, in `RootLayout`, so a Sync that stops to ask — pressed,
Autosync's, or the one before an account deletion — has a dialog on every route. The names are the
runner's to fetch (`SyncProvider` reads them once a review opens, and `runner.review` carries them as
they load); the dialog only renders what it has.

### The banner

`SyncBanner` (`src/widgets/sync/ui/SyncBanner.tsx`), above the deck library in
`src/pages/deck-library/ui/DeckLibraryPage.tsx` and mirrored in Settings → Sync. Its count is
`selectPendingCount` — decks, folders, cards and questions, because those are the only collections
that record pending changes at all.

| State                              | Tone                  | Action                            |
| ---------------------------------- | --------------------- | --------------------------------- |
| Nothing pending, cloud unchanged   | hidden                | —                                 |
| N pending changes                  | warning               | Synchronise                       |
| Cloud changed, nothing local       | info                  | Synchronise                       |
| Both                               | warning               | Synchronise                       |
| Syncing                            | info, progress        | —                                 |
| Synced                             | success, auto-dismiss | —                                 |
| Failed                             | danger                | Retry, with the reason            |
| Offline with pending changes       | warning, muted        | none — states the count and waits |
| Restoring after cancelled deletion | info, progress        | —                                 |
| Guest, or no Supabase configured   | hidden                | —                                 |

Motion communicates: the banner slides in once when a change makes it relevant and does not
re-animate on every count change. It honours `prefers-reduced-motion` and sits inside the safe area.

### Settings → Sync

New page: last synced (relative), pending count broken down by kind, **Synchronise now**, the
**Autosync** toggle, and **Review pending changes**, which opens the same dialog on demand.

### Autosync

When on, `useAutosync` (`app/providers/use-autosync.ts`) runs a Sync on reconnect, on every
`visibilitychange` (returning and leaving), on `pagehide`, and 4 s after writes settle.
**Destructive divergence still always opens the dialog** — Autosync removes the need to press a
button, never the user's say over a deletion. Every trigger goes through `syncNow`; an earlier build
called the cycle directly on leave and pushed deletions unclassified. With Autosync off there is
deliberately no trigger at all, because that is what manual means.

One Sync runs at a time: a second request joins the one in flight. The runner's state is a pure reducer
(`app/providers/sync-runner-state.ts`).

Scheduling lives in `SyncProvider`, classification in `sync-now.ts`, replication lifecycle in
`SyncManager`, Realtime in `CloudWatcher`. `SyncManager` does not absorb all four.

### Consequences to accept

- A second device sees nothing until it syncs. Realtime now only lights the banner.
- Signing into a different account wipes a device that may hold weeks of unsynced work, and nothing can
  push it — the previous account's session is gone, and a push now would carry its decks into the new
  account. **As built,** the old `onUnsyncedLoss` toast (which the wipe's reload swallowed) is gone:
  `useDataTransition` holds the wipe when the log is not empty, and `UnsyncedResetDialog` states the
  count and offers **Erase and continue** or **Sign out** — "syncing first" means signing back into the
  previous account and pressing Synchronise.

### Testing

- `pendingChanges` collapses repeated edits; a save after a remove replaces it; device-local and
  singleton stores record nothing.
- `peekRemoteChanges` returns ids only and reuses `buildPullFilter` (asserted against the existing
  filter tests).
- `syncNow` returns `clean` with no remote changes — including when the log holds deck and folder
  removals, which push silently; `merged` for disjoint and for mergeable overlaps; `needs-review` for
  delete-here-versus-edit-there and for a deleted deck whose cards changed in the cloud.
- A failed push leaves the log and checkpoints intact; a replication error on `error$` fails the cycle
  instead of hanging it.
- Checkpoints step over this device's own pushed rows and stop at another device's row that landed
  mid-cycle, raising `cloudChanged`.
- A document deleted on both sides asks nothing; a container's unseen descendants are found at any depth
  from parents alone, with no content fetched.
- A Delete answer re-deletes, tombstones unseen descendants, and is not asked again.
- Dismissing the dialog applies nothing (exercised through `SyncReviewDialog`).
- The fake cloud in `features/sync/testing/fake-cloud.ts` stamps a real, increasing clock and honours the
  checkpoint — the first fake answered `[]` to any checkpoint, which is how the checkpoint bug passed.
- `keepCloudCopy` restores a deleted document and drops its pending change.
- Banner renders all ten states, including offline, restoring and guest.
- Autosync off performs no network call on reconnect, focus, or `pagehide`.
- `CloudWatcher` sets `cloudChanged` and applies no document.

---

## Slice C — storage privacy and orphan cleanup

### Decision

Both buckets go private. Documents store the object **path**, not a URL. Bytes are cached ahead of
the read, so a read never touches the network.

### One type for the clump

`(bucket, userId, entityId)` currently travels separately through `upload`, `remove` and both
migrations, and would travel through two more functions here. It becomes one type in
`src/shared/api`:

```ts
type ObjectRef = { bucket: StorageBucket; userId: string; entityId: string }
const objectPath = (ref: ObjectRef) => `${ref.userId}/${ref.entityId}`
```

`StoragePort` takes `ObjectRef` throughout.

### Migration, and its read-side twin

`deckSchema` 3 → 4 and `profileSchema` 1 → 2. Both strategies convert a stored public URL
(`.../storage/v1/object/public/<bucket>/<userId>/<entityId>`) to its `<userId>/<entityId>` path, leave
`data:` inline values untouched — an inline image is a waypoint, not a URL, and
`reconcileInlineImages` still owns it — and leave an unrecognised string as-is rather than discarding
it.

A migration alone is not enough, and the repo already knows why. `database.ts:80` records it for card
styles: _"not upgraded can still deliver `outlined` afterwards; `coerceCardStyle` is what catches
that"_, and `entities/deck/model/settings.ts:18` applies that coercion at the read boundary. Pulled
rows are written straight into the collection without running a migration strategy, so a device still
on deck v3 will push a full public URL after this slice ships.

So Slice C adds the twin: `coerceImagePath` in `src/shared/lib`, applied on the read path in the deck
and profile entities exactly where `coerceCardStyle` is applied. **As built,** the deck's twin is
`completeDeck` (passed to the store as `complete`), and `deckMigrations[4]` _is_ `completeDeck`, so the
migration and the read repair cannot disagree; the profile's is inside `completeProfile`. A stored URL read after the fact is
narrowed to its path; an inline value passes through. Without this, an un-migrated device's deck
cover renders as "unavailable" on every other device.

### Reading an image without touching the network

`MOBILE_DESIGN.md:124` is binding: _"RxDB is the local source of truth — reads never touch the
network. Never block UI on a round-trip."_ Minting a signed URL during render would break that on
every deck cover.

So the fetch is a keeper, not a read:

- `StoragePort` gains `signedUrl(ref, expiresIn): Promise<string>`. TTL is **3600 seconds** — long
  enough that one mint covers a session, short enough to be worth having made the bucket private.
  `LocalObjectUrlStorage` returns the object URL it already holds, so the no-cloud path is unchanged.
  A missing object throws `ObjectMissingError` (storage answers 400 with `statusCode: '404'`), so it can
  be told apart from an unreachable one. `upload` answers `{ path }`, and `parseObjectPath` is the one
  place a stored path is read back into an `ObjectRef`.
- `keepImagesCached` — **as built in `src/features/media/keep-images-cached.ts`**, not
  `app/persistence/`: it repairs no stored document, which is what that folder is for. Started by the
  composition root. It watches the deck and profile stores, and for every referenced path not already
  settled it mints a URL, fetches the bytes, and stores them keyed by `<bucket>/<path>`. It runs at
  start, whenever the stores change **and on every reconnect**; offline it does nothing and tries
  again. An object storage says does not exist is marked missing, so the reader stops waiting.
- `useImageSrc(bucket, value)` in `src/shared/lib` reads **only** the cache. Only a `data:` value is
  inline; anything else is an object path and is never handed to the browser as a URL. Four states:
  `inline`, `cached`, `pending` (not settled yet — caller renders its placeholder), and `unavailable`
  (no value, or marked missing). When the keeper settles an image, `onImageSettled` tells the hook to
  look again, so `pending` resolves without a remount.

### Server side

A Postgres migration flips `storage.buckets.public` to `false` for both buckets and replaces each
`_read` policy with one requiring `(storage.foldername(name))[1] = (select auth.uid())::text`, the
predicate the insert, update and delete policies already use.

### Orphan cleanup

Deleting a deck removes its object, best-effort: a failure offline leaves it, and the account purge
is the backstop. **As built,** `deleteDeck(deps, id)` removes the cover of every deck in the subtree, and
its dependencies are assembled once by `useDeleteDeckDeps` / `useDeleteFolderDeps` so no screen can
forget the storage port. The avatar needs no cleanup — its path is stable (`${userId}/${PROFILE_ID}`) and
upload upserts over it.

### Testing

- Both migrations: public URL to path, inline untouched, unrecognised value preserved.
- `coerceImagePath` narrows a URL arriving by replication, on the read path, with no migration run.
- `useImageSrc` performs no network call in any state, reports `unavailable` for a missing object, and
  updates itself when the keeper settles an image.
- `keepImagesCached` fills the cache when online, does nothing offline, retries on reconnect and on
  store changes, and marks a missing object.
- Deck deletion calls `remove` and tolerates its failure.

---

## Slice D — history sync

### Decision

The learning history stops being device-local.

### Prerequisite

`pg_cron` is not enabled in this project — nothing under `supabase/` references it. This slice adds a
migration enabling it, and notes in its plan that on hosted Supabase the extension must also be
enabled for the project before the migration will apply. Slice E depends on the same prerequisite and
must not re-add it. **As built:** `create extension if not exists pg_cron with schema pg_catalog`
plus the two `cron` grants the Cron module's install guide gives, and Slice E's `pg_net` goes into
`extensions` rather than `public`, which the "Extension in Public" advisor asks for.

### Mechanism

- Postgres migration: a `history` table matching the other mirror tables, the same per-user RLS loop,
  added to the `push_documents` allow-list and to the realtime publication.
- `history` joins `SYNCED_TABLES` in `src/app/composition-root.ts`. It records no pending change and
  is excluded from the banner count by construction, having no `PendingChangePort`.
- Its conflict handler is **first write wins**, not a field merge: an entry records one answer given
  at one moment and is never edited, so two copies of an id are the same event and either is correct.
  A new handler beside `lastWriteWins` in `src/app/persistence/conflict-handlers.ts`, named for what
  it means rather than reusing a merge that implies mutability.
- Server-side retention mirrors `HISTORY_CAP` (2000): a daily `pg_cron` job (`trim-history`, calling
  `public.trim_history()`) trims each user's rows to the newest 2000 by `data->>'createdAt'`. `keepHistoryCapped` continues to cap the device; neither is sufficient alone,
  because the device cap cannot see another device's entries and the server cap cannot run offline.

### Testing

- Two devices producing the same entry id converge without duplication.
- An entry pulled from the cloud does not resurrect one the device trimmed, because trimming is by
  recency and the pulled entry is older than the cap boundary.
- The table appears in the allow-list check that guards `push_documents`.

---

## Slice E — real account deletion, 30-day grace

### Decision

Requesting deletion schedules an irreversible purge 30 days out, cancellable by signing in. It needs
the network and is gated offline.

### Server

`account_deletions (user_id uuid primary key references auth.users, requested_at timestamptz,
purge_after timestamptz)`, RLS restricted to the owner's own row for select and delete; inserts come
only from the Edge Function.

**`request-account-deletion`** (Edge Function, secret key, `verify_jwt = false` — it checks the caller's JWT itself): upserts the row with
`purge_after = now() + interval '30 days'`, then signs the user out globally.

**`purge-account`** (Edge Function, secret key, `verify_jwt = false` — it accepts only the project's secret key on `apikey`), invoked daily by the `purge-accounts` `pg_cron` job
(through `pg_net`, with `project_url` and `secret_key` read from Vault), for every row past
`purge_after`:

1. Empty `deck-images/${user_id}/` and `avatars/${user_id}/`, a page at a time until a listing comes
   back empty.
2. Hard-delete the user's rows from all eight mirror tables (the seven of today plus `history`).
3. `auth.admin.deleteUser(user_id)` — which removes the `account_deletions` row by cascade.

**Corrected in revision 3.** The first draft deleted the `account_deletions` row as its own step
_before_ deleting the auth user, and claimed that order left the account retryable. It did the opposite:
a failed `deleteUser` left an auth user with no schedule behind it, and nothing ever tried again. With
the user last and the row removed by cascade, a failure at any step leaves the account still scheduled
and the next run retries — and storage is still emptied first, so nothing is orphaned behind a deleted
auth row. The first draft's single `list(…, { limit: 1000 })` also stopped at a thousand objects.

### Requesting it without destroying unsynced work

With Autosync off, the device may hold weeks of work the cloud has never seen. Wiping it on request
would destroy exactly what a cancellation is supposed to restore. So the request runs a **Sync
first** — it needs the network anyway:

1. Gate offline with `OfflineNotice`; this is squarely category A under ADR 0004. **As built:** the
   Delete account row itself is disabled offline and says why.
2. Run `syncNow` (`prepareAccountDeletion`). A `needs-review` outcome closes the sheet and opens the
   review dialog, which is mounted on the profile page for this.
3. If the Sync fails, stop and say so, with a retry. Do not offer to continue: the only reason to wipe
   the device is that the cloud has everything, and it does not.
4. Typed confirmation, stating the date the purge happens — shown only after step 2 succeeded.
5. `requestAccountDeletion` synchronises **once more** (typing the word takes long enough for a write
   to land), then calls the function, signs out, and wipes local through `resetLocalData`.

`useDeleteAccount` is rewritten around this as one stage union driven by a pure reducer
(`pages/settings-profile/model/delete-account-machine.ts`). It no longer wipes stores and blanks the
profile — that was the bug, and those writes replicated.

### Cancelling

Every sign-in path checks for an own `account_deletions` row. Finding one, the app shows
**"Scheduled for deletion on <date>"** with **Cancel deletion** and **Sign out**. This belongs in
`AuthProvider`, which already owns the moment a session is restored.

**As built:** `AuthProvider` runs the check whenever the session becomes an account and publishes it on
`ScheduledDeletionContext`; `ScheduledDeletionGate`, inside the sync provider (cancelling needs the
runner), renders from it. While the check is out the app is held back — but for at most 4 s
(`CHECK_BUDGET_MS`), and not at all offline: holding every launch hostage to a round trip would break
"never block UI on a round-trip", and it is safe because requesting deletion signs every device out, so
a session on a scheduled account only comes from a sign-in, which is online. A check that could not
answer retries on reconnect.

Cancelling deletes the row and then **forces one Sync regardless of Autosync**, with the banner in
its _Restoring_ state. **As built,** `cancelAccountDeletion` resolves as soon as the cancel lands and hands
back the restore still running, and the gate opens the app at that moment — otherwise the Restoring
banner would play behind the gate where nobody can see it. Without that, a user who cancels lands in an empty app — local was wiped at
request time, Autosync may be off on this device, and the banner's "nothing pending, cloud
unchanged" state is hidden, so nothing would tell them their data is one press away. The restore is not optional and
is not left to the user to discover.

### Testing

- Requesting offline is blocked before the press.
- Requesting with a failing Sync stops and explains; nothing is wiped and no function is called.
- Requesting online after a clean Sync: function called, local wiped, signed out.
- A signed-in user with a pending row sees the notice and cannot reach the app until they choose.
- Cancelling removes the row, forces a Sync, and the data is back without the user pressing anything.
- A Supabase integration test asserts that after `purge-account` nothing owned by the user remains in
  any of the eight tables or either bucket, and that no schedule row or auth user remains
  (`src/shared/api/supabase/purge-account.integration.test.ts`, needs `SUPABASE_TEST_SECRET_KEY`).

---

## Slice G — monoliths and Lexend

Behaviour-preserving throughout. Tests stay green; no user-visible change.

- `src/shared/i18n/locales/en.ts` (1246 lines) → `locales/en/*.ts` by domain, merged in an index.
  Still one locale; `shared/i18n` keeps its current public shape. **As built:** `core`, `library`,
  `deck-settings`, `sync`, `account`, `auth`, `study`, `profile`, `settings`; the split was checked
  deep-equal to the single file before it was deleted.
- `src/pages/dev-preview/ui/DevPreviewPage.tsx` (732) → one module per section. **As built:**
  `ui/kitchen-sink/<Name>Section.tsx` × 9, plus `layout.tsx` and `fixtures.ts`.
- `src/widgets/dev-probe/model/viewport-sample.ts` (534) → measurement split from formatting. **As
  built:** `viewport-sample.ts` (measurement and checks), `viewport-text.ts` (formatting),
  `use-viewport-probe.ts` (the per-frame hook).
- `src/shared/lib/card-style.ts` (453) → preset data split from resolution logic. **As built:**
  `shared/lib/card-style/` — `ids.ts`, `coerce.ts`, `materials.ts`, `presets.ts`, `index.ts`.

**Lexend.** `src/styles/index.css` drops `@import '@fontsource-variable/lexend/index.css'`, which
ships every subset the typeface has. `src/styles/fonts.css` declares Lexend's `@font-face` directly
for latin and latin-ext only, matching how Literata, Nunito and Caveat are already handled there, and
the header note that currently explains why Lexend was _left_ whole is rewritten to record the
decision and its cost: Cyrillic, Greek and Vietnamese deck names and card text fall back to the
platform sans. Because Workbox precaches `**/*.woff2` by glob, every subset on disk is a subset the
phone downloads on install — which is the whole reason the cut is worth making.

---

## Risks

- **Manual sync is a backup regression.** Accepted deliberately; the banner is the mitigation and
  Autosync is one toggle away.
- **Private buckets break images the keeper has not reached yet.** `useImageSrc` reports `pending`
  and the placeholder renders; the keeper fills it on the next connected moment.
- **The peek is a second source of checkpoints.** Ours and RxDB's advance independently and could
  drift. They are allowed to: ours only decides what to _ask the user about_, and RxDB's decides what
  is actually applied. Ours must only ever lag, which is why it steps over rows this device pushed and
  never past anyone else's: a lagging checkpoint over-reports divergence, the safe direction.
- **A remote edit landing between the peek and the cycle is applied unasked.** The cycle pulls it and
  `lastWriteWins` may resurrect a document deleted here. The window is the length of one cycle; the
  row is left ahead of the checkpoint, so it is at least reported on the next Sync.
- **Slice B changes app startup**, the riskiest kind of change in a PWA, since a failure there is a
  blank screen rather than a broken feature. It goes first so every later slice is exercised on top
  of it, and it ships with an explicit error screen and a build-output check.
- **Server side is not self-deploying.** The migrations, both Edge Functions, `pg_cron` and `pg_net`
  enabled for the project, and the two Vault secrets all have to be in place; until they are, purge
  does nothing (it logs a notice) and private buckets are the only change the client can feel. **As
  built:** everything but the Vault secrets is applied and deployed — see `docs/2.Bugs.md`. Applying
  the migrations needed the hosted history repaired first, because the existing rows carried
  different timestamps from the local files.
