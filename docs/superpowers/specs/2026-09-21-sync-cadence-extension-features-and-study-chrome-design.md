# Two cadences of Sync, switchable extension features, and a study scene without a bar

Date: 2026-09-21 · Status: approved

Refines `2026-09-15-offline-sync-and-account-lifecycle-design.md` (which tables a manual Sync carries) and
`2026-09-18-first-sync-splash-and-synced-settings-design.md` (settings follow the account — they now also travel
on their own). Extends `2026-09-17-extensions-and-bible-add-cards-design.md` with features an Extension declares.

## 1. Why

- **Sync reports the wrong things as waiting.** Opening a deck row, changing the theme or reordering the Library
  writes a Preference, which lands in the Pending change log beside the cards. The banner then says "7 changes are
  waiting" when six of them are furniture. Nothing the learner recognises as _their work_ is waiting.
- **The Bible extension has no front door.** Settings → Extensions offers one link, to a screen that is mostly
  destructive tools. Nothing says what the extension _is_, what it provides, or lets a learner keep one part of it
  and drop another.
- **Fast review offers grades it cannot honour.** The flashcard swipe settings are keyed by _display_ mode
  (blur / words / initials / type) and offer `again / hard / good / easy` in every one of them. In a Fast review
  session those swipes are swallowed: `handleCommit` calls `applyGrade`, the footer only knows Not quite / Got it,
  and the direction chip promises "GOOD" on a card that cannot be graded.
- **The study footer is a bar in a scene.** The header floats over the Card style's scene; the footer sits on a
  `border-t` strip of `bg-card-glass`, which cuts the printed material in half. "Tap to show answer" is a paragraph,
  not a target.
- **"You already have …" is a wall.** Importing a chapter already in the Bible library joins every reference with
  commas: twenty-eight of them on one line.

## 2. Decisions

| Question                                        | Decision                                                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Which tables wait to be asked?                  | Decks, cards, folders, questions, **progress**, **learning history**, and every Extension table. Grading a card writes three of those; they travel together. |
| Which travel on their own?                      | **Preferences** and **profiles**. Nothing about them is ever reported as waiting.                                                                            |
| Does Autosync govern the quiet ones?            | No. A Quiet sync needs an Account and a connection, nothing else. Autosync governs the held tables only, and its copy now says so.                           |
| Does a quiet write still enter the Pending log? | Yes. The log stays the one record of what has not been confirmed; cadence is a lens the cycles and the UI look through, never a second log.                  |
| Does a Quiet sync write the Sync log?           | No, and it does not move `lastSyncedAt`. That date answers "when did my work last go up".                                                                    |
| Can a Quiet sync ask a question?                | No. Only Content collections can diverge destructively, and none of them is quiet.                                                                           |
| How does an Extension offer parts of itself?    | It declares **Extension features**; contributions and routes name the feature they belong to, and a switched-off feature withdraws them.                     |
| Where is a feature's switch stored?             | `preferences.disabledFeatures` — the ids switched **off**, so a feature a newer build adds is on without a write and an unknown id round-trips.              |
| Does switching a feature off stop the runtime?  | No. `activate` still starts the extension's spine. A store that vanishes under a mounted screen is a worse bug than an idle one.                             |
| What keys a flashcard swipe?                    | The **Learning algorithm** × the display mode. A grade cannot be chosen in Fast review, and Not quite / Got it cannot be chosen in Spaced repetition.        |
| What happens to the footer bar?                 | It goes. The scene runs unbroken from header to safe area, and the controls float on it like the header's do.                                                |
| How are held references named?                  | Collapsed into ranges, counted first, capped — `12 of these are already in your library: Efeseni 3:6–9, 3:12 +2 more`.                                       |

## 3. Two cadences of synced table

### 3.1 The vocabulary

A synced table has a **cadence**:

- **Held** — its changes wait to be asked. Synchronise sends them; Autosync asks on the learner's behalf.
- **Quiet** — its changes go on their own, as soon as they can, and are never reported as waiting.

`SyncTableSpec.cadence` carries it, and `ExtensionCollectionSpec.cadence` defaults to `held`: an extension holds a
learner's content until it says otherwise. `activeSyncTables(specs, isEnabled, cadence?)` derives the two live lists
from the same place it already derives the whole one, so the watcher, the peek and both cycles cannot disagree about
which table is whose.

### 3.2 A cycle can be scoped

Today `SyncManager.cycle` builds a replication for every live table, so **any** cycle pushes **everything**. A quiet
push would carry the waiting cards with it and the page would be lying. So `runCycle` takes the tables it covers:

```ts
runCycle(tables: readonly SyncedTable[]): Promise<PushedIds>
```

Single-flight becomes scope-aware. One cycle runs at a time; a request whose tables the running cycle already covers
joins it, and any other request chains behind it. A quiet cycle therefore never interleaves replications with a
manual one, and a Synchronise tapped during a quiet push waits for it rather than racing it.

`CloudSyncPort.runCycle` gains the same parameter, and `fake-cloud` records the scope so tests can assert that a quiet
cycle never touched `cards`.

### 3.3 The two cycles

`syncNow` becomes the **held** Sync. Its pending snapshot, its two peeks, its cycle and the `cloudChanged` it
records are all scoped to the held tables. Everything else about it — the destructive review, the token retry, the
Sync log, `lastSyncedAt` — is unchanged.

`quietSync(deps)` is new, and deliberately smaller: peek the quiet tables → run a quiet cycle → advance their
checkpoints → clear the pending rows it confirmed. No divergence pass, no log line, no `lastSyncedAt`. A failure is
silent: the rows stay in the log, and the next trigger tries again. It returns a `SyncOutcome` so callers can see
what happened without the banner having to.

`restore` (the first Sync under the splash) and `repairSync` keep the **full** scope. A device that has never synced
must pull everything, and "check everything against the cloud" means everything.

### 3.4 What triggers a Quiet sync

`useQuietSync` sits beside `useAutosync`, both waiting on the shared `useQuietFire`, and needs only `deps !== null`
and a connection:

- debounced after the last quiet Pending change (`WRITE_DEBOUNCE_MS`, so ten taps on a toggle are one push) — read
  through `selectLatestPendingAtIn(quiet)`, so a graded card never restarts a settings push's wait or the reverse,
- on `online`, on `visibilitychange`, on `pagehide`,
- when the cloud watcher reports a quiet table moving, and after a watcher reconnect.

It does not retry on a ladder. Preferences are cheap and the next change or page event will carry them.

### 3.5 What the learner sees

- **Waiting on this device** lists held tables only. With nothing held it reads "Nothing is waiting — your work is
  up to date", not "this device is up to date", because the settings were never in question.
- **Autosync** moves under a section named for the work it governs and says what that is: decks, cards, folders,
  questions, study progress and learning history.
- A new **Settings and profile** row states the quiet rule in the learner's words — that appearance, the rows left
  open in the Library, and the profile go up by themselves as soon as they change — with an offline variant.
- The banner counts held changes only, and "this account changed on another device" ignores quiet tables. A theme
  changed on the laptop must never raise a banner asking the phone to Synchronise.

No schema change and no migration: a Pending change already carries its `table`.

## 4. Extension features

### 4.1 The contract

```ts
interface ExtensionFeature {
  id: string // unique within the extension
  icon: ReactElement
  labelKey: string // the extension's own namespace — no English in a manifest
  descriptionKey: string
}
```

`ExtensionManifest.features?: ExtensionFeature[]`. An `ImportOptionContribution` and an `ExtensionRoute` may name a
`feature`. `ExtensionsProvider` withdraws contributions whose feature is off; `ExtensionGate` redirects a route whose
feature is off, exactly as it does for an extension that is off.

The runtime is untouched. `activate` starts the extension's spine whatever the features say, and a feature is read
where it is honoured — in the screens and commands that would otherwise do the work.

### 4.2 Where the switch lives

`preferences.disabledFeatures: Record<ExtensionId, string[]>` stores the ids switched **off**. Storing the negative
is what makes a feature added by a newer build arrive on, and an id this build does not know survive
`completePreferences` instead of being deleted on the next write — the same reasoning `preferences.extensions`
already follows.

- `entities/preferences`: `isExtensionFeatureOn(prefs, extensionId, featureId)`, completed and normalised in
  `completePreferences`.
- `features/preferences/set-extension-feature.ts`: the one command that changes it.
- Schema bump + migration, paired with §5's, as one step (§7).

### 4.3 The Bible's three features

| Feature            | Provides                                                           | Off means                                                   |
| ------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| **Passage import** | The Add-a-passage screen and its tile in the import sheet          | The tile is withdrawn; the route redirects to Extensions    |
| **Verse library**  | Saving verse text, filling a picked passage in from it, coverage   | Import still works; it neither reads nor writes stored text |
| **Chapter decks**  | Placing cards in a deck for the book and a subdeck for the chapter | Import asks for one destination deck, like any other import |

Switching Verse library off never deletes a verse, and its table keeps replicating: text already saved is the
learner's, and a switch is not a delete.

### 4.4 The overview screen

`/settings/extensions/bible` becomes the **overview**, and the manifest's `settings` becomes `overview`:

1. **What this is** — the extension's icon, name, and a paragraph naming it for what it is: a passage importer with a
   verse library of its own, in Cornilescu 2024, that works offline.
2. **What it provides** — the three features, each a toggle with its description.
3. **Your Bible library** — books with text, verses held, and the two library tools (add text from your cards, add
   text from one deck). These are housekeeping a learner wants, not diagnostics.
4. **Bible developer tools** — a row shown only in dev mode, to the screen below.
5. **Switch off Bible** — the same write Settings → Extensions makes, so the extension can be dropped from its own page.

`/settings/extensions/bible/developer` is the old screen, renamed **Bible developer tools** and gated on dev mode:
forget a book, the coverage list with its forget action, and the translation the build ships. Reached from the
overview and from nowhere else.

Settings → Extensions links to the overview, labelled with the extension's name rather than "settings".

## 5. A swipe belongs to a Learning algorithm

`LEARNING_ALGORITHMS` (`['fast', 'spaced']`) moves down to `shared/config/algorithms.ts` and is re-exported by
`entities/deck`, so the swipe config can key on it without `shared` reaching up a layer.

```ts
type FlashcardSwipeByMode = Record<LearningAlgorithm, Record<FlashcardMode, FlashcardSwipeConfig>>
```

**Vocabulary.** Shared in both: `flag`, `skip`, `none`, plus the display mode's own actions (`hideMore`, `showAll`,
`showWords`, `reset`, `nextWord`). **Spaced repetition** adds `again / hard / good / easy`. **Fast review** adds
`gotIt / notQuite`. `actionsFor(algorithm, mode)` is the one derivation; `normalizeFlashcardSwipe` refuses an action
the pair does not allow and falls back to that pair's default.

**Defaults.** Spaced: ← Again, → Good, ↑ Flag, ↓ Skip. Fast: ← Not quite, → Got it, ↑ Flag, ↓ Skip.

**Honouring them.** `handleCommit` routes a grade to `applyGrade` and a fast answer to `applyAnswer`; `DirectionChip`
tints Not quite with `--warning-foreground` and Got it with `--success-on-surface`; `GearSheet` offers the session's
own vocabulary and names the algorithm it is configuring, so a setting can never be made where it cannot apply.

**Migration.** Preferences schema bump. The stored by-mode map becomes the `spaced` branch; `fast` gets the fast
defaults. `normalizeFlashcardSwipe` keeps recognising the by-mode shape and the older flat one — the read-side twin
CLAUDE.md requires, because replication writes pulled rows unmigrated.

## 6. The footer stops being a bar

`StudySessionFooterShell` loses `border-t border-border/60` and `bg-card-glass` and becomes transparent padding. The
Card style's scene then runs unbroken from the header to the safe area, and every control floats on it the way the
header's buttons already do.

- **Tap to show answer is a button.** A glass pill (`bg-card-glass`, `shadow-rest`, ≥44 px), carrying `data-flip` so
  `swipeAllowed` lets a swipe start on it, calling the same reveal the card's own tap calls. It replaces the
  paragraph in both algorithms — Fast review had one, Spaced repetition showed nothing to tap at all.
- **Unflipped row** — remaining-count chips (Spaced) or the two tallies (Fast) keep their place as floating chips,
  the pill in the centre, and a circular Undo `IconButton` at the trailing edge, enabled only when there is something
  to undo. This is the row the reference screenshots show.
- **Flipped row** — the grade buttons and the two fast answers keep their colours, now floating with `shadow-rest`
  instead of sitting on a strip.

Everything the footer paints is inside `CardScene`, so every class it uses must be a scene role token;
`scene-chrome.test.ts` already enforces this and covers the new elements without being changed.

## 7. Persisted data

One schema bump for `preferences`, carrying both changes, with one migration step and the read-side twins beside it:

| Field              | Migration (this device)                                      | Read-side twin (`completePreferences`)                           |
| ------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| `flashcardSwipe`   | The by-mode map becomes `{ spaced: <it>, fast: <defaults> }` | `normalizeFlashcardSwipe` recognises by-algorithm, by-mode, flat |
| `disabledFeatures` | `{}`                                                         | Unknown extension and feature ids round-trip untouched           |

Nothing else is persisted by this work. Cadence needs no storage, and the footer none.

## 8. Testing

- **Cadence** — `heldTables`/`quietTables` from specs; `syncNow` leaves quiet pending rows alone and never peeks a
  quiet table; `quietSync` clears quiet rows, writes no log line, leaves `lastSyncedAt` where it was, and asks
  nothing; a scoped `runCycle` against `fake-cloud` pushes only its scope; the banner and the Sync page count held
  changes only.
- **Features** — a contribution and a route withdraw when their feature is off; `isExtensionFeatureOn` defaults to on
  for an unknown id; `setExtensionFeature` writes the negative list; the overview renders its three toggles and hides
  developer tools without dev mode.
- **Swipe** — `actionsFor` per algorithm × mode; `normalizeFlashcardSwipe` on all three stored shapes; a fast answer
  swipe calls `onAnswer` and a grade swipe `onGrade`; the chip's tint per action.
- **Footer** — the pill reveals the answer on tap and carries `data-flip`; undo is disabled with nothing to undo;
  `scene-chrome` stays green.
- **References** — the range collapse over single verses, runs, gaps, and across chapters; the capped message.

## 9. The import message

A pure helper in `extensions/bible/model/` collapses held references into ranges — `Efeseni 3:6–9, 3:12` — and the
banner counts first and caps the list: `12 of these are already in your library: Efeseni 3:6–9, 3:12 +2 more.` The
toggle beside it stops reading backwards: **Add them again anyway**, under a line saying they are skipped by default.
The import summary and "nothing new" get the same treatment.
