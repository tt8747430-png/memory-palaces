# ADR 0005 — Merge against what you saw

- **Status:** accepted · **Date:** 2026-09-18

The implementation is `supabase/migrations/20260918131048_push_documents_base.sql` and
`…/20260918142455_push_documents_deletion_and_first_push.sql`, `base` and `base_deleted` on `PushRow`
(`shared/api/supabase/document-mapping.ts`, `buildPushPayload`), `mergeFields` (`shared/lib/merge-fields.ts`),
`mergeAgainstBase` (`shared/api/rxdb/conflict-handlers.ts`) and the three entity handlers in
`app/persistence/conflict-handlers.ts`. Each carries the reasoning per site; this records the rule they follow.

## Context

Two devices, one card. The tablet fixes a typo in the back. The phone, which has not pulled since, studies the card:
`grade-card.ts` saves the whole document with a new `srs` and a new `updatedAt`. The phone pushes. The server compared
clocks: the phone's was newer, so the whole card — old back, new review — replaced the tablet's copy. No conflict was
ever raised, because to the server it was not one. The tablet's next Sync pulled its own edit back out from under it,
and the banner on both devices said _Everything is synchronised_.

The same shape lost XP: two devices earning on top of 100 (110 here, 120 there) settled at `max`, 120, because with no
record of the 100 there was no way to say 130. It lost deck renames, folder moves, profile edits — anything kept as a
whole document.

The lost update is the classic problem of last-writer-wins, and a document clock cannot solve it: a newer clock says
_this write is later_, not _this write saw yours_.

## Decision

> **A push says which server copy it was based on, the server refuses a write over any other, and a conflict is
> merged field by field against that same copy.**

Three parts, each necessary:

1. **The base travels with the push.** RxDB records, on every pull, the server copy a device last saw
   (`assumedMasterState`). Its `updatedAt` goes with the row as `base` (`null` when the device never pulled the
   document), and whether it was a deletion as `base_deleted` — a deletion keeps its clock, so the clock alone
   cannot tell the two copies apart. This is the one fact the server lacked.
2. **The server applies a row only over its base.** `push_documents` accepts a based row when it holds no copy, holds
   exactly this data (an idempotent re-push), or holds the copy the row names; anything else it hands back. Every
   document a push names is held by a transaction-scoped advisory lock, taken in id order before the check, so the
   check and the write see the same copy — including a document nobody holds yet, which has no row to lock. A row
   without a base keeps the clock rule — that branch serves builds shipped before this ADR and goes with a later
   migration.
3. **The handler merges against the base.** What comes back is a conflict with three versions in hand: mine, theirs,
   and what both started from. `mergeFields` keeps the field only one side changed, settles a field both changed by a
   rule (`srs` merged, XP summed as deltas, a preference to the device making the write) or by the newer clock, carries
   a deletion, and stamps the later clock so neither side refuses the result. RxDB pushes it again, now based on the
   copy it was refused over, and the server takes it.

Without a base — a device that never pulled the document — the old rules stand: the newer whole document, or the
`max` of each counter. That is the best that can be said with two versions, and it is rare: it needs a document that
exists on the server and on a device that never synced it.

## Consequences

- No conflict handler may assume two versions. Every handler is `mergeAgainstBase({ against, without })` or built from
  it; `lastWriteWins` is gone. A collection an extension declares gets the generic `mergeAgainstBase()` and merges
  field by field like everything else.
- A counter that must add up (XP, streak freezes) needs a `both` rule in its handler; a whole-document field needs
  nothing. Adding a field to an entity does not touch the handler unless two devices changing it at once has a better
  answer than "the newer one".
- `refuseUnseenOverwrites` and the pre-push `select` are gone: the server does this for every table, atomically. A
  future table needs only its place in `push_documents`' allow-list.
- A push may now come back refused for a document the device thought it owned outright. The banner does not show
  this — RxDB resolves and re-pushes within the same cycle — but the cycle takes a round trip more when it happens.
- An older build's rows carry no `base` and keep last-writer-wins against each other. Two devices on the new build
  never lose an update; one on each may, until the old one updates.
- **Nothing may drop what a device saw.** `replicationState.remove()` deletes the checkpoint _and_ every
  `assumedMasterState` with it, turning each change still waiting into a base-less push and every conflict into
  "newer whole document". Repair (`SyncManager.rereadEverything`) therefore passes over only the checkpoint: the pull
  handler reads from the first document for one cycle, and every base stays.
