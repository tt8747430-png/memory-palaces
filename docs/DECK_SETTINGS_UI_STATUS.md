# Deck settings and algorithms — what is real

Every control this phase shipped, and what stands behind it. Three verdicts:

- **Works** — the control changes what the app does.
- **UI only** — the control renders and is reachable, but nothing reads it yet.
- **Invented** — there was no reference screen; the surface is our design. It may still persist.

Anything not **Works** carries what phase 2 owes it.

> Scope note: AI card generation, publish-to-library, sharing settings, report deck, offline learning
> and the Language-learning preset are **absent from the UI on purpose** — not disabled, not stubbed.

## Deck settings (`pages/deck-settings`)

| Control              | Status    | Notes                                                            |
| -------------------- | --------- | ---------------------------------------------------------------- |
| Algorithm row        | **Works** | Shows the resolved algorithm; opens Algorithm settings.          |
| Text-to-speech (nav) | **Works** | Opens the TTS page.                                              |
| Card style (nav)     | **Works** | Opens the Card style page.                                       |
| Import cards         | **Works** | Existing import flow.                                            |
| Rename deck          | **Works** | Opens the appearance sheet — name, icon, colour, cover.          |
| Move deck            | **Works** | Reuses the library's `MoveSheet`; a deck can't move into itself. |
| Duplicate deck       | **Works** | Existing command.                                                |
| Reset progress       | **Works** | Clears `srs` **and** `fastReview`, so both faces reset together. |
| Archive / Restore    | **Works** | Existing command.                                                |
| Export deck          | **Works** | CSV and Anki TXT.                                                |
| Delete deck          | **Works** | Confirms first.                                                  |

## Algorithm settings (`pages/deck-algorithm`)

| Control           | Status    | Notes                                                                   |
| ----------------- | --------- | ----------------------------------------------------------------------- |
| Algorithm picker  | **Works** | Writes `settings.algorithm`; inherited by subdecks.                     |
| New cards per day | **Works** | Caps how many never-studied cards enter a queue, under both algorithms. |
| Max cards per day | **Works** | Caps every queue, both algorithms; also caps the deck-detail count.     |
| Shuffle cards     | **Works** | Shuffles the built queue.                                               |

Under Fast review only Shuffle is shown — the daily limits and Advanced belong to the scheduler.

## Advanced settings (`pages/deck-algorithm`, sub-page)

| Control             | Status       | Phase 2 owes it                                  |
| ------------------- | ------------ | ------------------------------------------------ |
| Learning steps      | **Invented** | Stored on the deck; `schedule()` never reads it. |
| Graduating interval | **Invented** | Same.                                            |
| Easy bonus          | **Invented** | Same.                                            |
| Maximum interval    | **Invented** | Same.                                            |
| Leech threshold     | **Invented** | Same — there is no leech handling at all yet.    |
| Reset to defaults   | **Works**    | Writes `DEFAULT_SPACED_ADVANCED` and toasts.     |

Every field validates and persists. **None of them changes a single interval today.** Phase 2 has to
teach `shared/lib/srs.ts` to read `settings.advanced` before this page means anything. The page says
so itself, in `algorithm.advancedHint`.

## Card style (`pages/deck-card-style`)

| Control          | Status    | Notes                                                                              |
| ---------------- | --------- | ---------------------------------------------------------------------------------- |
| Preset strip     | **Works** | Five presets; the study card wears the chosen one.                                 |
| Font             | **Works** | Four families, applied through `--card-style-font`.                                |
| Text size        | **Works** | 14–40, stepped by 2, clamped by `clampCardTextSize`.                               |
| Alignment        | **Works** | Left / centre / right.                                                             |
| Live preview     | **Works** | Shares `CARD_STYLE_SURFACE`/`CARD_STYLE_TEXT` with `CardFace`, so it cannot drift. |
| Reset card style | **Works** | Restores `DEFAULT_CARD_STYLE`.                                                     |
| Haptics toggle   | **Works** | Writes the **global** preference, not a deck setting.                              |

`chalk`, `notebook` and `paper` are printed materials: their colours are fixed in both themes on
purpose. `plain` and `outlined` follow the theme tokens.

## Text-to-speech (`pages/deck-tts`)

**Invented** — there was no reference screenshot for this page.

| Control          | Status      | Phase 2 owes it                                                          |
| ---------------- | ----------- | ------------------------------------------------------------------------ |
| Read cards aloud | **Works**   | The study session already speaks when this is on.                        |
| What to read     | **UI only** | Validated and stored as `tts.side`; the session still speaks both sides. |
| Speech rate      | **UI only** | Stored as `tts.rate`; `speak()` uses the platform default rate.          |
| Test voice       | **Works**   | Speaks a sample through the same `speak()` the session uses.             |
| No-voices state  | **Works**   | The whole page collapses to an explanation when there is no voice.       |

Phase 2: have `speak()` take the deck's `tts` and honour side and rate.

## Card actions sheet (`widgets/content-editor`)

| Action            | Status      | Notes                                                                             |
| ----------------- | ----------- | --------------------------------------------------------------------------------- |
| Select            | **Works**   | Enters multi-select on that card.                                                 |
| Edit              | **Works**   | Opens the card editor.                                                            |
| Freeze/Unfreeze   | **Works**   | Excluded from both queues and from both deck-detail study counts.                 |
| Move              | **Works**   | Existing move flow.                                                               |
| Reverse/Unreverse | **Works**   | The session asks a reversed card back-first, composing with the deck's direction. |
| Duplicate         | **Works**   | Existing command.                                                                 |
| Learning history  | **UI only** | There is no review log to draw. The sheet says so.                                |
| Delete            | **Works**   | Confirms first.                                                                   |

Phase 2 owes Learning history a review log — no table records reviews today.

## Deck detail (`pages/deck-detail`)

| Element                 | Status    | Notes                                                             |
| ----------------------- | --------- | ----------------------------------------------------------------- |
| Algorithm line          | **Works** | Names the algorithm, explains it, and can change it in place.     |
| Fast overview           | **Works** | Not studied / Not quite / Got it, capped by Max cards per day.    |
| Spaced overview         | **Works** | New / Learning / Mastered over what is due.                       |
| Maturity bar            | **Works** | Rendered under Spaced repetition only — maturity is an SRS shape. |
| SRS chip on rows        | **Works** | Hidden under Fast review for the same reason.                     |
| Frozen / Reversed chips | **Works** | Read straight off the card.                                       |

Under Fast review a deck is never "caught up": every unfrozen card is always on offer, so the
caught-up state is skipped rather than shown with a zero.

## Study session (`widgets/study-session`)

| Element             | Status    | Notes                                                                     |
| ------------------- | --------- | ------------------------------------------------------------------------- |
| Progress header     | **Works** | `done/total` pill over a fill; honours reduced motion.                    |
| Fast-review footer  | **Works** | Not quite / Got it with live tallies.                                     |
| Re-insertion rule   | **Works** | "Not quite" returns the card four places on, and keeps returning it.      |
| Bucket persistence  | **Works** | Each answer writes `card.fastReview`; deck detail reads it back.          |
| Grade footer        | **Works** | Unchanged under Spaced repetition.                                        |
| Card style on cards | **Works** | Only the card's material and words follow the style; chrome keeps tokens. |
| Due filter          | **Works** | Hidden under Fast review, where nothing is scheduled.                     |

## The honest summary

Fast review is **complete**: it schedules nothing by design, so there is nothing left to build behind
it. Its buckets are the only new scheduling state this phase persists.

"Frozen … excluded from every count" means the two study counts on deck detail. **"Cards in deck (N)"
is deck inventory and still counts frozen cards** — that is the number of cards the deck holds, not
the number on offer.

Spaced repetition is **unchanged**. The daily limits are real and shape the queue, but the intervals
behind it still come from the existing `schedule()` with its built-in constants. Everything under
Advanced settings is stored and ignored.
