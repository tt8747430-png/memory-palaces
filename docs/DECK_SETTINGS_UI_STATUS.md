# Deck settings — what is real

Read before touching deck settings, the algorithm screens or card style ([CLAUDE.md](../CLAUDE.md) routes you here).
Every control on those screens is one of three things. **Don't build on a control this doc calls _UI only_ or
_Invented_.**

| Status       | Meaning                                                                        |
| ------------ | ------------------------------------------------------------------------------ |
| **Works**    | Wired end to end: a command writes it, something downstream reads it.          |
| **UI only**  | Stored on the deck, honoured by nothing yet. Changing it changes no behaviour. |
| **Invented** | Drawn in a mock, no field and no command. Does not exist.                      |

## Deck settings (`pages/deck-settings`)

| Control             | Status | Notes                                                                                           |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| Algorithm card      | Works  | Opens the algorithm screen; `settings.algorithm` drives the study queue.                        |
| Text-to-speech row  | Works  | `settings.textToSpeech` + `settings.tts`; the card face's speaker button reads them.            |
| Card style row      | Works  | See below.                                                                                      |
| Import cards        | Works  | `ImportSheet` → paste screen, or a file through `useImportFile` → import review.                |
| Rename / appearance | Works  | `DeckAppearanceSheet` → `editDeck`.                                                             |
| Move                | Works  | `moveDeck`; "archive" as a destination is the archive act — same dialog, same exit.             |
| Duplicate           | Works  | Behind a confirmation; `duplicateDeck` copies the deck and its cards.                           |
| Reset progress      | Works  | Behind a confirmation; `resetDeckSrs` clears every card's schedule.                             |
| Archive / restore   | Works  | Archiving is confirmed from either entry point and returns to the library; restoring stays put. |
| Export              | Works  | CSV and Anki text. Disabled with no cards.                                                      |
| Delete              | Works  | Behind a destructive confirmation.                                                              |

## Algorithm (`pages/deck-algorithm`)

| Control                                                                              | Status  | Notes                                                                   |
| ------------------------------------------------------------------------------------ | ------- | ----------------------------------------------------------------------- |
| Algorithm picker (`fast` / `spaced`)                                                 | Works   | Chooses the queue builder.                                              |
| New cards / day, max cards / day                                                     | Works   | `spaced` only; the queue honours both.                                  |
| Shuffle                                                                              | Works   | Shuffles the built queue.                                               |
| Advanced (steps, graduating interval, easy bonus, maximum interval, leech threshold) | UI only | Stored in `settings.advanced`; `shared/lib/srs` does not read them yet. |

## Card style (`pages/deck-card-style`)

| Control                    | Status | Notes                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preset (7 scenes)          | Works  | A preset is a **scene**: `resolveCardStyle` paints the card, `resolveCardScene` the flashcards screen behind it, and `data-scene` hands the chrome over it to `tokens.css` — everything inside `CardScene`. Its three callers are `FlashcardsPanel`, `PresetStrip` and the style page's preview; the completion overlay, the sheets, and the quiz and match screens are outside it and keep the app's own chrome. |
| Font, text size, alignment | Works  | Resolved into `--card-style-*` and read by the study card, the preview and the thumbnails.                                                                                                                                                                                                                                                                                                                        |
| Apply bar                  | Works  | Edits live in a draft and are previewed live; only **Apply** writes. Leaving discards.                                                                                                                                                                                                                                                                                                                            |
| Reset                      | Works  | Resets the _draft_, so it is undoable until Apply. Disabled when the style already is the default.                                                                                                                                                                                                                                                                                                                |
| Haptics                    | Works  | A global preference, not a deck setting — it writes immediately, outside the draft.                                                                                                                                                                                                                                                                                                                               |

## Confirmations

Every yes/no on this screen goes through one `usePendingAct<DeckSettingsConfirm>` in
`model/use-deck-settings.ts` and is drawn by `ui/DeckSettingsDialogs.tsx`. `ConfirmDialog` fires `onConfirm` **before**
it closes, so the act has to be handed over exactly once — `page.confirm()` resolves the pending act, and a
double-tapped confirm cannot run the command twice. Never wire a `ConfirmDialog` here straight to a command.

## Persisted shape

`settings` is `Partial<DeckSettings>` on the deck document; a missing key resolves to the default at read time, so a
new key needs no rewrite. The RxDB `decks` schema is at **version 2** — v2 widened the card-style preset enum for
`parchment` and `night`, which is why its migration is identity. Any further change to the stored shape needs a
version bump and a strategy in `app/persistence/database.ts` ([CLAUDE.md](../CLAUDE.md), "persisted data").
