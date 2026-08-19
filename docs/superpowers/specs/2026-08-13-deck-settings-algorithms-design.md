# Deck settings and learning algorithms

Status: approved design, not yet implemented.
Reference: screenshots in `~/Downloads/new_settings/` (deck settings, algorithm settings, card actions
sheet, card styles, fast review, spaced repetition).

## Goal

Rebuild every deck-scoped settings surface around an explicit **learning algorithm** the learner
picks per deck. A deck runs either **Fast review** or **Spaced repetition**, and that choice changes
what the deck screen counts, what the study footer offers, and which settings exist.

This phase builds the surfaces and persists every user-facing choice. The scheduling behaviour
behind Spaced repetition stays as it is today; the tuning knobs the new screens expose are stored
but not yet consulted. `docs/DECK_SETTINGS_UI_STATUS.md` records exactly which rows are live and
which are shells.

## Non-goals

Out of scope, deliberately, and absent from the UI rather than disabled: AI card generation,
publishing to a library, sharing settings, reporting a deck, offline learning, and the
Language-learning algorithm preset. Learning history is drawn but has no data behind it.

## Domain model

### `LearningAlgorithm`

`'fast' | 'spaced'`, on `DeckSettings`, default `'spaced'` — existing decks already have schedules,
so the default must describe them truthfully.

`resolveDeckSettings` already folds a deck's ancestry, so a subdeck inherits its parent's algorithm
and style until it sets its own. That is the desired behaviour and needs no new code.

### `DeckSettings` additions

```ts
export type LearningAlgorithm = 'fast' | 'spaced'
export type CardStylePreset = 'plain' | 'outlined' | 'chalk' | 'notebook' | 'paper'
export type CardFont = 'default' | 'serif' | 'rounded' | 'mono'
export type CardAlignment = 'left' | 'center' | 'right'
export type TtsSide = 'front' | 'back' | 'both'

export interface CardStyle {
  preset: CardStylePreset
  font: CardFont
  textSize: number      // 14–40, default 30
  alignment: CardAlignment
}

export interface SpacedAdvanced {
  learningSteps: number[]     // minutes, default [1, 10]
  graduatingInterval: number  // days, default 1
  easyBonus: number           // default 1.3
  maximumInterval: number     // days, default 36500
  leechThreshold: number      // lapses, default 8
}

export interface DeckSettings {
  quizTimer: boolean
  studyDirection: StudyDirection
  shuffleQuestions: boolean
  shuffleCards: boolean
  textToSpeech: boolean          // kept: the TTS master switch
  algorithm: LearningAlgorithm
  newCardsPerDay: number         // default 10
  maxCardsPerDay: number         // default 3000
  cardStyle: CardStyle
  tts: { side: TtsSide; rate: number }   // default { side: 'both', rate: 1 }
  advanced: SpacedAdvanced
}
```

`makeDeck`/`updateDeck` keep taking `Partial<DeckSettings>`; `DEFAULT_DECK_SETTINGS` grows the new
keys. Nothing stored has to be rewritten, because a deck document that predates a key simply
inherits the default through `resolveDeckSettings`.

Validation lives in `entities/deck/model/types.ts` and throws on invariant violation, per the entity
rule: `newCardsPerDay` and `maxCardsPerDay` must be `>= 0`, `textSize` within 14–40, `rate` within
0.5–2, enum members must be members.

### `Card` additions

```ts
frozen: boolean                          // excluded from every study queue
reversed: boolean                        // studied back → front, overriding the deck direction
fastReview?: 'notQuite' | 'gotIt'        // fast-review bucket; absent means not studied
```

`frozen` and `reversed` are learner choices, so they persist. `fastReview` persists because the deck
screen counts those buckets — session-only state would render "3000 Not studied" forever.

### Persistence

Both collections take a version bump and a migration strategy in
`src/app/persistence/database.ts`, alongside the existing `preferencesMigrations`/`profileMigrations`:

- `deckSchema` `0 → 1`: `settings.properties` gains the new keys (the object is
  `additionalProperties: false`, so this is required); strategy is identity — absent keys resolve to
  defaults at read time.
- `cardSchema` `0 → 1`: adds `frozen`, `reversed` (both in `required`) and optional `fastReview`;
  the strategy fills `frozen: false, reversed: false`.

Supabase needs no work: `docToRow` writes the whole document into a JSONB `data` column, so new
fields replicate as they are.

## Screens

Seven surfaces. Every one handles loading, error, empty and offline, uses semantic tokens, and takes
its rows from the existing `SettingsSection`/`SettingsRow` primitives.

### 1. Deck settings (`/decks/$deckId/settings`, rewrite)

Replaces the current appearance-card-plus-two-sections layout with three grouped sections:

1. **Algorithm** — one tall row: preset icon, the algorithm's name, "Algorithm preset" beneath,
   chevron. Navigates to Algorithm settings.
2. **Study** — Text-to-speech (nav), Card style (nav).
3. **Manage** — Import cards, Rename deck, Move deck, Duplicate deck, Reset progress, Archive deck,
   Export deck, then Delete deck in the danger tone.

Rename opens the existing appearance sheet; Move opens the existing move-deck transfer sheet;
Import, Duplicate, Reset, Archive, Export and Delete keep their current commands and confirmations.

### 2. Algorithm settings (`/decks/$deckId/settings/algorithm`, new)

Header "Algorithm settings". First row is the current preset, tinted, opening the chooser sheet.
Below it, the rows the chosen algorithm actually has:

- **Fast review** — Shuffle cards.
- **Spaced repetition** — New cards per day, Max cards per day, Shuffle cards, then an "Advanced
  settings" button below the section.

Numeric rows open a `PromptSheet` with a number field rather than a nested page.

### 3. Choose learning algorithm (sheet)

Titled sheet with a close button, one selectable card per algorithm: icon, name, checkbox on the
right, description below. Selecting one writes `settings.algorithm` and closes. Two cards only —
Fast review and General spaced repetition.

Switching a deck to Fast review does **not** clear its schedules; switching back finds them intact.
This is stated on the sheet so the choice reads as reversible.

### 4. Advanced settings (`/decks/$deckId/settings/algorithm/advanced`, new)

No screenshot exists — invented, and marked so in the status doc. Rows for the `SpacedAdvanced`
fields with a "Reset to defaults" action. Persisted, not yet consulted by `schedule()`.

### 5. Card style (`/decks/$deckId/settings/card-style`, new)

Header with back, a reset-to-defaults action, and the haptics toggle from the screenshot. Body:

- A live preview card rendered by the same component the study screen uses, so the preview cannot
  drift from the real thing.
- **Presets** — a horizontal row of five thumbnails, the active one ringed.
- **Font** — nav row opening a font picker.
- **Text size** — `−` / value / `+` stepper, 14–40.
- **Alignment** — three-way segmented control.

Presets are drawn with CSS gradients and inline-SVG patterns (lined notebook, chalk grain, aged
paper, marble). No binary assets, so no bundle or precache cost.

Style resolution is pure and unit-tested: `shared/lib/card-style.ts` maps a `CardStyle` to CSS
custom properties, and `CardFace` consumes them. That keeps every study mode, the preview and the
thumbnails on one implementation.

### 6. Text-to-speech (`/decks/$deckId/settings/tts`, new)

No screenshot — invented, marked so. Master toggle (`settings.textToSpeech`), which side speaks,
speech rate, and a "Test voice" button. Gated on `speechAvailable()`, with an explicit unsupported
state.

### 7. Card actions sheet (rewrite of the row menu)

The row's overflow opens a bottom sheet of full-width pill rows: Select, Edit, Freeze/Unfreeze,
Move, Reverse/Unreverse, Duplicate, Learning history, Delete (danger). The label flips with the
card's state, exactly as the screenshots show Reverse and Unreverse on two different cards.

Select, Edit, Move, Duplicate and Delete call today's commands. Freeze and Reverse are new
one-field commands in `features/card`. Learning history opens a sheet with an empty state naming
the next phase.

## Deck detail

Under the deck title: `Learning algorithm: <name>` with an info affordance opening a short
explainer sheet.

**Fast review** — "N cards to study", where N is every unfrozen card capped at `maxCardsPerDay`,
counted as Not studied / Not quite / Got it. That cap is why the reference screenshot offers 3000
cards to study out of 6336 in the deck. No maturity bar under "Cards in deck (N)". Rows show no due
chip.

**Spaced repetition** — "N cards for today" from `studyOverview`, counted as Not studied / Learning
/ Mastered, with the maturity bar and legend under "Cards in deck (N)". Rows show their due chip
("Today", "In 3 days") and, when set, a "Reversed" chip.

Both keep the existing sort control and filter sheet.

## Study session

The header becomes `✕ · <done>/<total> · ⋮` over a thin progress bar, for both algorithms.

**Spaced repetition** keeps today's `GradeButtons` — Again / Hard / Good / Easy with predicted
intervals, which already matches the screenshot — and today's `schedule()`.

**Fast review** gets a two-button footer, `<count> [Not quite] [Got it] <count>`. Per the product
definition, *Not quite means the card is still being learned and should come round more often*: the
card is re-inserted a short distance ahead in the queue (default four positions, and always before
the queue's end) and stays in the Not quite bucket until Got it retires it. A card can therefore be
seen several times in one pass, which is the point. Got it removes it from the queue.

This lives in `features/review/fast-review.ts` as a pure reducer beside `session-machine.ts`, with
its own tests: re-insertion distance, short queues, a card graded Not quite twice, and completion
only when every card has reached Got it. `FlashcardsPanel` chooses the reducer and the footer from
the deck's algorithm.

Frozen cards never enter either queue. Reversed cards swap prompt and answer regardless of the
deck's `studyDirection`.

### Daily limits

`maxCardsPerDay` truncates the built queue and `newCardsPerDay` limits how many never-studied cards
enter it, under both algorithms. Both are cheap, they make the counts on the deck screen honest, and
they are the reason the reference screenshots show the numbers they do — so they are live, not
stored-only. Everything in `SpacedAdvanced` is stored and ignored until `schedule()` is rewritten.

## Naming

`docs/UBIQUITOUS_LANGUAGE.md` gains: **Learning algorithm**, **Fast review**, **Spaced repetition**,
**Frozen**, **Reversed**, **Not quite**, **Got it**. The existing `known` vs Memorized entry stands;
"Mastered" is confirmed as the user-facing label for SRS `known`, which `srs.known` already reads in
one place today and will now read everywhere.

All copy lands in `src/shared/i18n/locales/en.ts` under `deckSettings`, `algorithm`, `cardStyle`,
`cardActions` and `fastReview`.

## Testing

Colocated Vitest, matching the repo's conventions:

- `shared/lib/card-style.test.ts` — style resolution, clamping, every preset.
- `features/review/fast-review.test.ts` — the reducer cases above.
- `features/card/freeze-card.test.ts`, `reverse-card.test.ts` — command behaviour.
- `entities/deck/model/types.test.ts` — new invariants throw.
- `app/persistence/database.test.ts` — both migrations produce valid documents from v0 fixtures.
- Page-level render tests for Algorithm settings (both variants), Card style, and the card actions
  sheet, in the style of the existing `SettingsPage.test.tsx`.

`npm run typecheck && npm run lint && npm run test` must pass before the work is called done.

## Status doc

`docs/DECK_SETTINGS_UI_STATUS.md` lists every row and control on all seven surfaces with one of
three marks — **Works**, **UI only**, **Invented (no reference)** — and, for anything not Works, the
sentence describing what the next phase has to build. It is written as part of the work, not after.
