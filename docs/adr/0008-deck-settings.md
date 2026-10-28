# ADR 0008 — Deck settings: the main deck owns the algorithm, a style is copied, stored-only stays unbuilt-on

- **Status:** accepted · **Date:** 2026-09 · consolidated 2026-10

The implementation is `entities/deck/model/types.ts` and `settings.ts`, `features/deck/update-deck-settings.ts` and
`apply-card-style.ts`, and the pages `deck-settings`, `deck-algorithm`, `deck-card-style` and `deck-tts`. Where a deck
stands in the Library is [ADR 0003](0003-the-library.md).

## Context

- A subdeck could hold its own learning algorithm, yet its cards are queued in its main deck's study session. A parent
  on spaced repetition with a subdeck on fast review was studied by both at once.
- The settings screens were first drawn from mocks, ahead of the code that honours them, so some controls stored a
  value nothing read.
- A card style belongs to one deck. Giving a subtree one look meant opening each deck and repeating the choice.

## Decision

- **The main deck owns the algorithm screen.** `MAIN_DECK_SETTINGS` (algorithm, new cards per day, max cards per day,
  shuffle, advanced) are read from the top of the tree alone (`resolveDeckSettings`). A subdeck never holds them:
  `makeDeck` and `updateDeck` drop them, and `updateDeckSettings` throws on a subdeck patch carrying one, because a
  screen offering that change is a bug to hear about. A deck that becomes a main deck (moved out, or archived) takes
  the values it was following (`placeDecks`), so it keeps being studied the way the learner last saw.
- **A subdeck explains, it doesn't disable silently.** The deck-detail line and the settings row wear a lock and open
  `AlgorithmLockedNotice`; the study session's sheet shows shuffle locked; the algorithm routes opened by URL pass
  through `MainDeckGate` to `MainDeckOnlyScreen`, with a way to the main deck.
- **A card style is copied, never inherited.** `cardStyle` is per deck and not a main-deck setting. `applyCardStyle`
  copies one whole style to a scope (this deck, its subtree, every live deck, or a selection) and skips decks whose
  style already matches, so the pending log grows only by the decks that changed. No app-wide default style.
- **Don't build on a stored-only control.** One control today stores a value nothing reads: **Advanced** on the
  algorithm screen (`settings.advanced`: learning steps, graduating interval, easy bonus, maximum interval, leech
  threshold). `shared/lib/srs` ignores it. Wire the scheduler to it before anything depends on it. Every other deck
  setting is read downstream.
- **Settings are stored partial.** `settings` is `Partial<DeckSettings>`; a missing key resolves to its default at
  read time, so a new key needs no rewrite. Retiring an id needs both halves: a migration for this device, and a
  coercion on read for rows replication writes unmigrated (`coerceCardStyle` inside `resolveDeckSettings`), while
  `validateDeckSettings` stays strict for writes.

## Consequences

- A subdeck's stored algorithm overrides go on its next write. They were never read.
- Two layers hold the main-deck rule on purpose: the entity drops the fields on every write (the stored shape), the
  command throws (the caller's bug).
- Applying a style to a hundred decks puts up to a hundred changes in the pending log, held until Synchronise.
- Every yes/no on the deck settings screen goes through one `usePendingAct`, so a double-tapped confirm can't run the
  command twice. Never wire a `ConfirmDialog` there straight to a command.
- The `decks` schema is at version 4. v3 retired the `outlined` preset (repainted `plain`, font, size and alignment
  kept); v4 turned a stored public cover URL into its object path (`completeDeck`, the strategy and the read repair at
  once).

## History

- Algorithm settings held per deck, subdecks included (replaced 2026-09).
- The deck settings screens built UI-first from mocks, tracked by a table of Works / UI only / Invented per control
  (2026-09). Replaced by this record's list of what is still stored-only.
- A card style given to one deck at a time (replaced 2026-09 by `applyCardStyle`).
