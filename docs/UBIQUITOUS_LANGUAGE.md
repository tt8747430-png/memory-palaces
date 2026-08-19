# Ubiquitous Language

Canonical terms for code, UI copy, commits, discussion. Grounded in `entities/*` and `shared/lib`.

## Content

| Term         | Means                                                 | Avoid                         |
| ------------ | ----------------------------------------------------- | ----------------------------- |
| **Folder**   | Top-level container grouping Decks                    | group, category               |
| **Deck**     | Study set of Cards + Questions; may nest as a Subdeck | palace, set, collection, list |
| **Subdeck**  | Deck under a parent Deck (`parentId`)                 | child deck, nested deck       |
| **Card**     | Flashcard: **front** + **back**                       | note, term, item              |
| **Question** | Multiple choice: prompt, options, one correct answer  | quiz item, MCQ, card          |

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

## Learning algorithms

Every Deck follows exactly one, inherited down the Deck tree by `resolveDeckSettings`.

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

## Relationships

- Folder groups zero-or-more top-level Decks.
- A Deck belongs to at most one Folder **or** one parent Deck as a Subdeck — never both.
- A Deck contains zero-or-more Cards and Questions; each belongs to exactly one Deck.
- A Review advances exactly one Card's schedule.
- A Study session = one Deck × one Practice mode × one Study filter.
- A Selection holds one kind of row at a time. Selecting a Deck takes its Subdecks — select mode is flat, so a Subdeck
  is never on screen there.
- A Learner has one Progress record and one active Session.

## Ambiguities — resolved

- **"session"** — **Session** = auth (Guest/Account). **Study session** = a pass through a Deck. Never abbreviate the
  study pass.
- **"palace / room / locus"** — brand, not model. The product name and store copy are allowed to say _memory palace_
  and _method of loci_ (`index.html`, the manifest, marketing surfaces). **Everything else ships
  Deck / Card / Question** — types, stores, routes, i18n keys, in-app copy, commits. A palace is never an entity.
- **`known` vs Memorized** — `known` is SRS-derived from the interval; **Memorized** is a manual boolean. Don't
  conflate. In learner-facing copy `known` reads **Mastered**; the field name stays `known`.
- **"algorithm"** — a **Learning algorithm** is the Deck-level choice (Fast review / Spaced repetition). The SRS
  scheduler itself is the **SRS**. Never call the scheduler "the algorithm".
- **"preset"** — in _code and types_ an algorithm is never a "preset"; a **preset** is one of the five Card style
  skins. The Deck settings row is labelled "Algorithm preset" because the design spec fixes that string — the label is
  the exception, not the rule.
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
