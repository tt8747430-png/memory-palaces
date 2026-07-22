# Ubiquitous Language

The shared vocabulary for Mindscape. Use these canonical terms in code, UI copy, commits, and discussion so we mean the same thing. Grounded in the `entities/*` and `shared/lib` domain model.

## Content structure

| Term         | Definition                                                                            | Aliases to avoid              |
| ------------ | ------------------------------------------------------------------------------------- | ----------------------------- |
| **Folder**   | A top-level container that groups Decks                                                | group, category               |
| **Deck**     | A named study set containing Cards and Questions; may nest as a Subdeck                | palace, set, collection, list |
| **Subdeck**  | A Deck nested under a parent Deck (`parentId`)                                         | child deck, nested deck       |
| **Card**     | A flashcard with a **front** and **back** the learner recalls                         | note, term, item              |
| **Question** | A multiple-choice item with a prompt, options, and one correct answer                  | quiz item, MCQ, card          |

## Study & scheduling (SRS)

| Term            | Definition                                                                          | Aliases to avoid    |
| --------------- | ----------------------------------------------------------------------------------- | ------------------- |
| **SRS**         | The spaced-repetition scheduler that sets when a Card is next Due                    | algorithm           |
| **Review**      | Grading a Card's recall, which advances its SRS schedule                            | practice, test      |
| **Grade**       | The recall rating for a Card: `again` / `hard` / `good` / `easy`                     | score, rating       |
| **Due**         | The timestamp when a Card is next scheduled for Review                               | next date           |
| **Card status** | A Card's SRS stage: `new` / `learning` / `known`                                     | state, level        |
| **Mature**      | A Card whose SRS interval has reached ≥ 21 days                                      | mastered            |
| **Memorized**   | A **manual** flag marking a Card the learner set as learned (not the SRS `known`)    | known, done         |
| **Flagged**     | A Card the learner marked for later attention                                        | starred, bookmarked |

## Study modes

| Term              | Definition                                                                | Aliases to avoid     |
| ----------------- | ------------------------------------------------------------------------- | -------------------- |
| **Study session** | One pass through a Deck in a given Practice mode                          | session, run         |
| **Practice mode** | Umbrella term for the ways to study a Deck                                | game, activity       |
| **Flashcards**    | The mode that reveals a Card front→back for self-graded recall            | study cards          |
| **Quiz**          | The mode that presents Questions to answer                                | test                 |
| **Match**         | The mode that pairs Cards in a matching game                              | pairs                |
| **Review**        | The mode that surfaces Due Cards for SRS grading (see above)              | practice             |

## Progress & gamification

| Term              | Definition                                                                | Aliases to avoid   |
| ----------------- | ------------------------------------------------------------------------- | ------------------ |
| **Progress**      | The learner's aggregate stats record (XP, streak, accuracy, training days) | stats, profile     |
| **XP**            | Experience points earned by studying                                      | points             |
| **Level**         | A tier derived from total XP                                              | rank               |
| **Streak**        | The count of consecutive Training days                                    | chain              |
| **Training day**  | A calendar day the learner studied                                        | active day, session |
| **Streak freeze** | A token that preserves a Streak across one missed Training day            | freeze, skip       |
| **Achievement**   | A one-time milestone the learner unlocks                                  | trophy, goal       |
| **Badge**         | An earned emblem with tiers/pips                                          | medal              |
| **Notification**  | An in-app notice of a level-up, streak, or quiz result                   | alert              |

## Identity & settings

| Term            | Definition                                                                          | Aliases to avoid       |
| --------------- | ----------------------------------------------------------------------------------- | ---------------------- |
| **Learner**     | The person using the app to study (represented by a Profile + a Session)            | user                   |
| **Session**     | The current sign-in — either a Guest or an Account (auth context, **not** studying) | login, study session   |
| **Guest**       | A Session with no signed-up account                                                 | anonymous              |
| **Account**     | A signed-up identity with an email                                                  | user, login            |
| **Profile**     | The learner's editable display data (name, username, bio, avatar)                   | account, user          |
| **Preferences** | Global app settings (haptics, swipe actions, theme)                                 | settings, config       |
| **Deck settings** | Per-Deck study options (timer, study direction, shuffle, text-to-speech)          | settings, config       |

## Relationships

- A **Folder** groups zero-or-more top-level **Decks**.
- A **Deck** belongs to at most one **Folder** (when top-level) **or** to one parent **Deck** as a **Subdeck** — never both.
- A **Deck** contains zero-or-more **Cards** and zero-or-more **Questions**.
- A **Card** or **Question** belongs to exactly one **Deck**.
- A **Review** advances exactly one **Card**'s SRS schedule.
- A **Study session** runs one **Deck** in one **Practice mode**.
- A **Learner** has one **Progress** record and one active **Session** (Guest or Account).

## Example dialogue

> **Dev:** "When a **Learner** marks a **Card** as **Memorized**, does that move its **Card status** to `known`?"
> **Domain expert:** "No — **Memorized** is a manual flag the learner sets. `known` is a **Card status** the **SRS** derives from the interval. A Card can be **Memorized** while still `learning`, and it only becomes **Mature** once its interval hits 21 days."
> **Dev:** "And a **Review** only happens in the Review **Practice mode**?"
> **Domain expert:** "Grading happens whenever a **Card** is **Due** — the Review mode just surfaces Due Cards. A **Study session** in Flashcards mode can also **Review** Cards. Don't call that pass a 'session' on its own, though — a bare **Session** is the auth context, Guest or Account."

## Flagged ambiguities

- **"session"** is overloaded. The **Session** entity is the **auth** context (Guest/Account). A **Study session** is a pass through a Deck. Never abbreviate the study pass to "session" — say **Study session**; reserve **Session** for auth.
- **"palace / room / locus"** — the product is *themed* as a memory palace (method of loci), but the shipped model is **Deck / Card / Question**. Don't use palace/room/locus in code, UI copy, or discussion; they're legacy design-doc vocabulary.
- **`known` vs Memorized** — `known` is an SRS-derived **Card status** (interval-based); **Memorized** is a manual boolean the learner sets. Distinct — don't conflate.
- **"settings"** — qualify it: **Deck settings** are per-Deck study options; **Preferences** are global app settings.
- **"user / account"** — three distinct things: the **Account** (auth identity with email), the **Profile** (editable display data), and the **Learner** (the human). "User" alone is ambiguous — pick the precise one.
- **"Card"** — in domain talk this always means the **flashcard**; the `shared/ui/Card` component is just a generic surface and doesn't carry the domain meaning.
- **`Combobox`** — the `shared/ui/Combobox` component is really a **Select** (choose one from a fixed list), not a free-text-filtered combobox. The name is a known misnomer kept for now; a rename to `Select` is a possible future tidy-up (out of scope for the shadcn/Base-UI migration).
