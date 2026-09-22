# ADR 0003 — The archive is a place; a subdeck studies on its main deck's terms

- **Status:** accepted · **Date:** 2026-09-13

The implementation is `entities/deck/model/placement.ts` and `settings.ts`, the `features/deck` commands
`archiveDecks` / `restoreDecks` / `moveDecks` / `detachArchivedDecks`, and `app/persistence/keep-archive-detached.ts`.
Each carries the same reasoning per function.

## Context

**Archive.** `archived` used to be a flag on a deck left where it stood: it kept its `folderId` and `parentId` and was
only hidden. Everything that walked the tree had to remember to skip it, and several things did not:

- Deleting a parent deck deleted its archived subdecks (`subtreeDeckIds` does not look at `archived`).
- A parent deck's card count and study session took an archived subdeck's cards (`cardsInSubtree`), while
  `dueCountsPerDeck` skipped them — two answers to one question.
- A deck restored into a folder deleted in the meantime pointed at nothing and vanished from the library. That is why
  `deleteFolder` had to unfile rather than delete.
- `orderSiblings` kept archived decks only so a restore could reclaim its old slot.

**Algorithm.** A subdeck could hold its own learning algorithm, but its cards are queued in its main deck's study
session. A parent on spaced repetition with a subdeck on fast review was studied by both at once.

## Decision

**The archive is a location, not a flag.** Archiving lifts the deck to `parentId: null, folderId: null` with
`archived: true`; its subdecks stay under it and are archived with it. Restoring lands the deck, subdecks and all, at
the top of the library, placed last. The one exception is the Undo on the archive toast, which puts the deck back where
it came from while that place is still in the library (`restoreDecks`' `from`). Nothing done to the place a deck left can reach it:
deleting a folder deletes every deck in it, and the archive is not in any folder.

A separate collection for the archive was rejected. It would need a second RxDB collection, a Supabase table and a
replication stream. Cards would have to follow their deck between collections, and every reader of decks would union
the two. That is a lot of cost with nothing a learner can see.

**The main deck owns the algorithm screen.** `MAIN_DECK_SETTINGS` (algorithm, daily limits, shuffle, advanced) are read
from the top of the tree alone (`resolveDeckSettings`). A subdeck never holds them: `makeDeck`/`updateDeck` drop them the
way they drop a subdeck's `folderId`, and `updateDeckSettings` refuses a patch carrying one. A deck that becomes a main
deck — moved out, or archived — takes the values it was following in place of any it stored itself
(`placeDecks`), so it keeps being studied the way the learner last saw.

**A batch is placed from one snapshot.** `placeDecks` computes every order and carried setting at once, so decks landing
in the same row take consecutive orders however late the store publishes each write. A batch built from a selection
drops every deck a selected ancestor already carries (`idsWithoutDescendants`).

## Consequences

- **Archives stored in place are repaired whenever they appear.** `keepArchiveDetached`, started by the composition
  root, watches the deck store for the life of the app and runs `detachArchivedDecks` whenever an archived deck still
  names a folder, or a parent that did not go into the archive with it — at the first snapshot, and again for one that
  replication brings in later from a build that predates this. It is not an RxDB migration: the document shape did not
  change, and a per-document strategy cannot see whether a parent is archived. It writes nothing once the archive is
  whole, and never writes from inside a store notification.
- **A subdeck's stored algorithm overrides are gone on its next write.** They were already never read.
- **The subdeck surfaces explain, they don't disable silently.** The deck-detail line and the deck-settings row wear a
  lock and open `AlgorithmLockedNotice`; the study session's settings sheet shows shuffle locked with the same hint; the
  algorithm routes opened by URL pass through `MainDeckGate` to `MainDeckOnlyScreen`, with a way to the main deck.
- **Two layers hold the settings rule, on purpose.** The entity drops a subdeck's main-deck settings on every write,
  because that is the stored shape. `updateDeckSettings` throws on a subdeck patch carrying one, because a screen
  offering that change is a bug to hear about, not to swallow.
- **A live deck whose place is gone stands at the top of the Library** (amended 2026-09-23). Replication can leave a
  deck naming a folder or parent another device deleted — one device files it, another deletes the folder while it
  still looks empty there. The tree is read from the top down, so such a deck was on no list at all while its cards
  still counted as held. `reachableDecks` (`shared/lib/deck-tree.ts`) stands it at the top, read-side only: a pull can
  land a deck before its folder, and a repair that wrote would unfile it for good. Sync now asks about the case too:
  `findDestructive` treats a held deck moved into a deleted container as a descendant, with everything inside it.
