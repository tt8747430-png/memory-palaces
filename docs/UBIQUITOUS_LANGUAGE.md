# Ubiquitous Language

Canonical terms for code, UI copy, commits, discussion. Grounded in `entities/*` and `shared/lib`.

## Content

| Term          | Means                                                 | Avoid                         |
| ------------- | ----------------------------------------------------- | ----------------------------- |
| **Folder**    | Top-level container grouping Decks                    | group, category               |
| **Deck**      | Study set of Cards + Questions; may nest as a Subdeck | palace, set, collection, list |
| **Subdeck**   | Deck under a parent Deck (`parentId`)                 | child deck, nested deck       |
| **Main deck** | The Deck at the top of a tree of Subdecks             | root deck, top deck, parent   |
| **Card**      | Flashcard: **front** + **back**                       | note, term, item              |
| **Question**  | Multiple choice: prompt, options, one correct answer  | quiz item, MCQ, card          |

## SRS

| Term            | Means                                                  | Avoid               |
| --------------- | ------------------------------------------------------ | ------------------- |
| **SRS**         | Scheduler setting when a Card is next Due              | algorithm           |
| **Review**      | Grading a Card's recall; advances its schedule         | practice, test      |
| **Grade**       | `again` / `hard` / `good` / `easy`                     | score, rating       |
| **Due**         | When a Card is next scheduled                          | next date           |
| **Card status** | `new` / `learning` / `known`                           | state, level        |
| **Mastered**    | The learner-facing word for SRS `known`                | Known, mastered-out |
| **Mature**      | Interval ≥ 21 days                                     | mastered            |
| **Memorized**   | **Manual** flag the learner sets — not the SRS `known` | known, done         |
| **Flagged**     | Marked for later attention                             | starred, bookmarked |
| **Frozen**      | Card held out of every queue until unfrozen            | paused, suspended   |
| **Reversed**    | Card studied back → front, whatever the Deck says      | flipped, inverted   |

### Learning history

| Term                 | Means                                                                          | Avoid              |
| -------------------- | ------------------------------------------------------------------------------ | ------------------ |
| **Learning history** | Every answer a Card has been given, newest first — `entities/learning-history` | review log, audit  |
| **History entry**    | One answer on it: a Grade, a Fast-review answer, or a Mastered mark            | review, row, event |

A **History entry** is deliberately wider than a **Review**: a Review advances a schedule, and the two
fast-review answers are not Reviews at all (see below), yet both belong on the history — as does a
**Mastered** mark, which moves a schedule with no recall behind it. That is why an entry is keyed on
`kind` (`graded` / `answered` / `mastered`) and never on the **Learning algorithm**.

An entry is written once and never edited. Undoing an answer removes it; **Reset progress** removes
every entry for the Cards it resets, because the history describes schedules those Cards no longer
have. The history syncs to every device (first write wins — two copies of an entry are the same answer) and is
capped at `HISTORY_CAP` on the device and by a daily trim on the server — a rolling window, not an archive. It records no
Pending change: an entry is never edited, so it can never be part of a Destructive divergence.

## Learning algorithms

Every Deck follows exactly one: its Main deck's. A Subdeck never holds the algorithm settings (`MAIN_DECK_SETTINGS`).

| Term                   | Means                                                            | Avoid                  |
| ---------------------- | ---------------------------------------------------------------- | ---------------------- |
| **Learning algorithm** | Which scheduler a Deck follows: Fast review or Spaced repetition | mode, preset, strategy |
| **Fast review**        | No schedules; every unfrozen Card is always on offer             | quick mode, cram       |
| **Spaced repetition**  | Intervals grow with recall; only Due Cards are offered           | SRS mode, SM-2         |
| **Not quite**          | Fast-review answer: the Card returns later in the same pass      | again, wrong           |
| **Got it**             | Fast-review answer: the Card retires from the pass               | good, correct          |
| **Card style**         | A Deck's card look: preset, font, text size, alignment           | theme, skin            |

## Study modes

| Term              | Means                                                      | Avoid            |
| ----------------- | ---------------------------------------------------------- | ---------------- |
| **Study session** | One pass through a Deck in a Practice mode                 | session, run     |
| **Practice mode** | Umbrella for the ways to study                             | game, activity   |
| **Flashcards**    | Front→back, self-graded recall                             | study cards      |
| **Quiz**          | Questions to answer                                        | test             |
| **Match**         | Pairing Cards                                              | pairs            |
| **Review**        | Surfaces Due Cards for SRS grading                         | practice         |
| **Study scope**   | _Which Deck_ a session runs over                           | scope            |
| **Study filter**  | _Which of its Cards_: all / due / new / learning / flagged | scope, selection |

## Organising

| Term            | Means                                                                            | Avoid                       |
| --------------- | -------------------------------------------------------------------------------- | --------------------------- |
| **Library**     | All Folders and Decks — and the home screen browsing them                        | home, list                  |
| **Selection**   | Rows picked in select mode, acted on together                                    | multi-select, checked items |
| **Select mode** | Entered on press-and-hold: header becomes the Selection's, toolbar at the bottom | edit mode, bulk mode        |
| **Card filter** | What a Deck's card _list_ shows: by status, or Flagged only                      | filter, scope               |
| **Archive**     | Where archived Decks live — a place of its own, outside every Folder and Deck    | hidden, trash               |

## Progress

| Term              | Means                                     | Avoid               |
| ----------------- | ----------------------------------------- | ------------------- |
| **Progress**      | Stats record (XP, streak, accuracy, days) | stats, profile      |
| **XP**            | Points earned by studying                 | points              |
| **Level**         | Tier derived from XP                      | rank                |
| **Streak**        | Consecutive Training days                 | chain               |
| **Training day**  | A day the learner studied                 | active day, session |
| **Streak freeze** | Preserves a Streak across one missed day  | freeze, skip        |
| **Achievement**   | One-time milestone                        | trophy, goal        |
| **Badge**         | Emblem with tiers/pips                    | medal               |
| **Notification**  | In-app notice (level-up, streak, result)  | alert               |

## Identity

| Term              | Means                                                      | Avoid                |
| ----------------- | ---------------------------------------------------------- | -------------------- |
| **Learner**       | The person studying (a Profile + a Session)                | user                 |
| **Session**       | Current sign-in — Guest or Account. **Auth, not studying** | login, study session |
| **Guest**         | Session with no account                                    | anonymous            |
| **Account**       | Signed-up identity with an email                           | user, login          |
| **Profile**       | Display data (name, username, bio, avatar)                 | account, user        |
| **Preferences**   | Global settings (haptics, swipe actions, theme)            | settings, config     |
| **Deck settings** | Per-Deck options (timer, direction, shuffle, TTS)          | settings, config     |

## Sync

| Term                       | Means                                                                                                                            | Avoid                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Sync**                   | One peek → classify → cycle → confirm pass (`syncNow`). Never a study pass, never a login                                        | sync session, refresh  |
| **Synchronise**            | The user-facing verb — the banner button, and every sentence in UI copy                                                          | sync (as a verb in UI) |
| **Autosync**               | The setting that runs a Sync without being asked. A preference: it follows the account. On by default                            | auto-sync, background  |
| **Pending change**         | One write to a synced document a Sync has not confirmed — any synced table, content or not. `pendingChanges`                     | dirty, unsaved         |
| **Cadence**                | How a table's changes leave the device: **Held** or **Quiet**. `SyncTableSpec.cadence`                                           | mode, policy           |
| **Held table**             | Its changes wait to be asked — decks, cards, folders, questions, progress, learning history, an extension's own                  | manual table           |
| **Quiet table**            | Its changes go on their own as soon as they can, and are never reported as waiting — preferences, profiles                       | auto table, background |
| **Quiet sync**             | The unasked cycle over the Quiet tables (`quietSync`). No question, no Sync log line, no `lastSyncedAt`                          | background sync        |
| **Table** _(of a change)_  | The synced table a Pending change belongs to. Stored as `table` — never `collection`, which RxDB owns on every document          | kind, collection       |
| **Content collection**     | One of the four tables a learner's content lives in (folders, decks, cards, questions) — the only ones a deletion can diverge on | table                  |
| **Base**                   | The server copy a device last saw of a document. Travels with every push; a conflict is merged against it (ADR 0005)             | last seen, ancestor    |
| **Repair**                 | The Sync page's tools: review pending changes, or check everything against the cloud                                             | reset, resync          |
| **Sync log**               | The device's record of its last ten Syncs — when, outcome, pushed, pulled                                                        | history                |
| **Checkpoint**             | Where this device's last Sync got to in a table — `(updated_at, id)`. Ours, not RxDB's                                           | cursor, bookmark       |
| **Divergence**             | The cloud and the device both changed since this device's last Sync                                                              | conflict               |
| **Destructive divergence** | A divergence no merge can settle — deleted here, changed elsewhere. The only question asked                                      | conflict               |
| **Review** _(of a Sync)_   | The dialog that answers a Destructive divergence: **Delete** (default) or **Keep**                                               | conflict dialog, merge |
| **Restoring**              | The forced Sync after a cancelled account deletion, shown on the banner                                                          | recovery, reload       |
| **Purge**                  | The irreversible server-side destruction of an account, 30 days after the request                                                | delete, wipe           |

## Extensions

| Term                   | Means                                                                                                      | Avoid                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Extension**          | A self-contained feature the learner switches on in Settings                                               | plugin, add-on, module         |
| **Contribution point** | The named slot a host surface renders on an extension's behalf                                             | hook, which here means React   |
| **Verse**              | One numbered line of scripture; its reference is not part of its text                                      | passage, which is a range      |
| **Bible library**      | The verse text an account holds, what the passage picker prefills                                          | library, which is the decks    |
| **Book code**          | A book's stable identity (`JHN`, `1CO`), what a verse is stored under                                      | name, which a translation owns |
| **Translation**        | Owns the book names and abbreviations the app shows — Cornilescu 2024                                      | version, language              |
| **Recent passage**     | A chapter the learner last added verses from, derived from their cards                                     | history                        |
| **Extension overview** | An extension's own front door: what it is, what it provides, and its feature switches                      | settings screen                |
| **Extension feature**  | One switchable part of an extension, declared in its manifest and stored in `preferences.disabledFeatures` | module, plugin                 |
| **Developer tools**    | An extension's destructive and diagnostic screen, behind Developer mode                                    | admin screen, settings         |

## Relationships

- Folder groups zero-or-more top-level Decks.
- A Deck belongs to at most one Folder **or** one parent Deck as a Subdeck — never both. An archived Deck belongs to
  neither: the Archive is its place, and restoring it lands it at the top of the Library.
- Deleting a Folder deletes every Deck in it; the Archive is never reached.
- A Deck contains zero-or-more Cards and Questions; each belongs to exactly one Deck.
- A Review advances exactly one Card's schedule.
- A Study session = one Deck × one Practice mode × one Study filter.
- A Selection holds one kind of row at a time. Selecting a Deck takes its Subdecks — select mode is flat, so a Subdeck
  is never on screen there.
- A Learner has one Progress record and one active Session.
- A device has one sync state and zero-or-more Pending changes; neither ever leaves it.
- A Pending change belongs to exactly one synced document; repeated writes to it collapse onto one entry. Only the ones on the tables a Sync covers count as waiting.
- Deleting a Deck deletes its Subdecks, Cards and Questions. A Destructive divergence on a Deck or Folder carries, as
  its descendants, what another device added inside it — Keep brings them in, Delete tombstones them too.
- An Account has at most one scheduled Purge; signing in before its date cancels it.
- Every RxDB **conflict** is inside a Divergence; most Divergences contain no conflict at all.

## Ambiguities — resolved

- **"session"** — **Session** = auth (Guest/Account). **Study session** = a pass through a Deck. Never abbreviate the
  study pass.
- **"palace / room / locus"** — brand, not model. The product name and store copy are allowed to say _memory palace_
  and _method of loci_ (`index.html`, the manifest, marketing surfaces). **Everything else ships
  Deck / Card / Question** — types, stores, routes, i18n keys, in-app copy, commits. A palace is never an entity.
- **`known` vs Memorized** — `known` is SRS-derived from the interval; **Memorized** is a manual boolean. Don't
  conflate. In learner-facing copy `known` reads **Mastered**; the field name stays `known`.
- **"Review"** — unqualified, a **Review** is grading a Card. The Sync dialog is the **review of a Sync** in prose and
  `SyncReviewDialog` in code; never call a Card review a sync review or the reverse.
- **"conflict" vs Divergence** — a **conflict** is RxDB's: one document arriving with two versions,
  settled by a `conflictHandler` without anyone being asked. A **Divergence** is the user-facing
  situation: both sides moved since the last Sync. Only a **destructive divergence** — a document
  deleted here and edited there — is ever put to the learner.
- **"algorithm"** — a **Learning algorithm** is the Deck-level choice (Fast review / Spaced repetition). The SRS
  scheduler itself is the **SRS**. Never call the scheduler "the algorithm". A flashcard swipe is stored **per
  Learning algorithm**: a Grade can only be flung under Spaced repetition, Not quite / Got it only under Fast review.
- **"Autosync" vs a Quiet sync** — **Autosync** is the preference that asks on the learner's behalf, and it governs
  the **Held** tables only. A **Quiet sync** is not Autosync and no preference turns it off: settings and the profile
  are not the learner's work to send.
- **"preset"** — in _code and types_ an algorithm is never a "preset"; a **preset** is one of the Card style scenes
  (`CARD_STYLE_PRESET_IDS`, eleven of them). The Deck settings row is labelled "Algorithm preset" because the design
  spec fixes that string — the label is the exception, not the rule.
  - A preset's **id is persisted and its label is not**, so the two are free to differ — but only where the id has
    gone stale, never as a rename. `paper` is labelled "Paper"; a preset whose material has changed enough to want
    another name wants a new id and a migration, the way `outlined` got one.
- **Not quite / Got it vs grades** — the two fast-review answers are _not_ Grades; they never touch `srs`. They live
  on the Card as `fastReview`, and Reset progress clears them alongside the schedule.
- **"scope"** — **Study scope** = which Deck (`StudyScope`, `MatchScope`); **Study filter** = which of its Cards (
  `StudyFilter`); the Folder the Library browses is a Folder. Never a bare `Scope`.
- **"filter"** — **Study filter** narrows a session's queue; **Card filter** narrows a Deck's list.
- **"settings"** — **Deck settings** are per-Deck; **Preferences** are global.
- **"user"** — pick one: **Account** (auth identity), **Profile** (display data), **Learner** (the human).
- **"Card"** — always the flashcard; `Card` in `shared/ui/primitives/card.tsx` is a generic surface with no domain
  meaning.
- **`Combobox`** — really a **Select**. Known misnomer, kept for now.
