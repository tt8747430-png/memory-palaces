# Mindscape

Mindscape is a phone-only spaced-repetition study app. Content is organized as **folders**
that hold **decks**; decks nest into **subdecks** without limit; each deck holds **cards**.
This glossary fixes the domain language so the UI, copy, and code all name the same things
the same way.

## Structure

**Folder**:
A flat, hand-orderable container at the library root that groups top-level decks. A folder
holds decks only — never cards, and **not** other folders (folders do not nest). A top-level
deck lives in at most one folder, or at the root (`folderId: null`). Deleting a folder
unfiles its decks back to the root; it never deletes a deck.
_Avoid_: nested folders/subfolders, collection, tag.

**Deck**:
A node in the deck tree: a named container holding its own cards and any number of child
decks. Every deck — at any depth — carries the full study system (spaced-repetition cards,
Questions/Test, Match, verse study) and its own settings. A top-level deck has
`parentId: null` and may be filed in a folder; a subdeck has `parentId` pointing at its
parent deck. Studying or counting a deck spans its whole **subtree**.
_Avoid_: palace, set; "deck" for the in-session review set (that is the _queue_).

**Subdeck**:
The positional word for a deck whose parent is another deck. Not a separate entity — a
subdeck **is** a `Deck`. Any deck can hold unlimited subdecks, nested to any depth.
_Avoid_: room, level, stage, chapter; treating subdeck as a distinct type.

**Own cards**:
The cards attached directly to a deck (`card.deckId === deck.id`) — the ones in none of its
subdecks. A deck may have zero own cards (everything in subdecks), only own cards (no
subdecks), or both.
_Avoid_: conflating own cards with subtree cards.

**Subtree**:
A deck plus all of its descendant decks. The unit of studying and counting: opening a deck
studies the union of every card in its subtree, and a deck's "cards for today" is the
subtree's due total.
_Avoid_: "all cards" (be explicit: the subtree).

**Library**:
The home screen (`/`): a browse of the root — folder cards and top-level deck rows together —
reorderable by drag (manual) or an automatic rule (recent/name/progress). Tapping a folder
enters it (`?folder=<id>`); tapping a deck opens it. A deck row expands inline into its
subdeck tree.
_Avoid_: "collections rail", "filters row"; calling the root a folder.

**Deck detail**:
The single screen for one deck (route `/decks/:deckId`): leads with a **study overview**
scoped to the deck's subtree, then the **practice rows** (Match, Test), then its **subdeck
tree**, then the deck's own cards-and-questions editor inline below. Where a learner lands
on opening a deck, whether it is a leaf or has subdecks.
_Avoid_: palace detail, room hub; deck page/screen/home.

**Deck settings**:
The full-page settings for one deck (route `/decks/:deckId/settings`): spaced-repetition
algorithm, text-to-speech, card style, sharing, import, rename/move/duplicate, reset,
archive, delete. Each field **inherits** its parent deck's resolved value unless the deck
**overrides** it; a card is scheduled by its own deck's **resolved** settings.
_Avoid_: shared "options group"/preset (deferred, separate concept).

**Card**:
One thing to recall inside a deck — front (prompt) and back (meaning). The flashcard entity;
"card" is both the domain/code term and the user-facing word.
_Avoid_: locus/loci, item, entry, note, flashcard (say "card").

**Question**:
A multiple-choice item attached to a deck, used by the Test/Quiz mode. Distinct from a card.
_Avoid_: prompt (the prompt is a field _on_ a question).

**Flagged**:
A learner-set mark on a single card ("come back to this"). Independent of the SRS schedule
and of `memorized`.
_Avoid_: starred, bookmarked.

## Progress

The app has one progress model; these three words are NOT interchangeable.

**Reviewed**:
A card is reviewed once it has left the "new" state (at least one successful rep). This is
the app-wide progress signal: it drives deck completion and subtree progress, and it is the
number the deck detail headlines.
_Avoid_: mastered, learned, done (when you mean "reviewed", say "reviewed").

**Completed**:
A deck is completed when every card in its subtree is reviewed (an empty deck is never
completed).
_Avoid_: finished, mastered.

**Mastered / Known**:
A finer, stricter SRS status: a card whose interval has matured (≥ 21 days). Per-card texture
and a breakdown figure — NOT the headline progress number, and never labelled as the deck's
overall progress.
_Avoid_: using "mastered" for the headline reviewed-%.

**SRS status** (maturity):
The maturity bucket of a single card — exactly one, ordered **New → Learning → Known**:
`new` (never successfully reviewed), `learning` (reviewed, interval still short), `known`
(interval ≥ 21 days). Independent of whether the card is due.
_Avoid_: treating `due` as a maturity bucket.

**Cards for today** (the **due** set):
Every card whose schedule has come up (`due ≤ now`), plus brand-new cards — a temporal set,
NOT a maturity bucket. A Known card can still be "for today". It is the headline count of the
study overview and exactly what the Study action drills, rolled up over the deck's subtree.
_Avoid_: calling due a status.

## Practice & streak

**Study overview**:
The per-deck daily-study panel: a headline _cards for today_ count over the deck's subtree, a
New/Learning/Known breakdown of that set, and the **Study action**. The Study action opens
the one **study session** in Flip, review mode — due cards lead — over the subtree; when
nothing is due it becomes _Study ahead_ over the same set.
_Avoid_: "today's training", "review hero", "up next".

**Study session** (the one flashcard surface):
A single full-featured session over a deck's subtree (route `/decks/:deckId/study`). Always
opens in Flip, review mode (due-first); the header **mode button** switches the **study
mode** mid-session (Flip, Type, First letters, Blur, Rebuild — every mode grades the same
cards). Filter/range, in-study edit, orientation, shuffle, text-to-speech, and sort-into-
piles live in the in-session sheet. There is exactly one such surface, and study is always
scoped to a deck subtree — there is no global cross-library review.
_Avoid_: "train"/"review"/"flashcard session" as separate things.

**Queue** (the in-session set):
The runtime, ordered set of cards a study session is walking (due-first, optionally
shuffled). A traversal structure inside one session — NOT the `Deck` entity.
_Avoid_: "deck" for this (a Deck is a persisted tree node; a queue is a session's card list).

**Practice**:
The umbrella for every study activity that exercises memory: the study session (any mode),
the Match game, and the Test/Quiz. Each completed item is one unit of practice. Deck detail
carries two **practice rows** below the study overview — Match and Questions/Test.
_Avoid_: "training" as the streak verb (see _Active day_); a Practice page or mode grid.

**Daily goal**:
The number of practiced items a learner must reach in a day to keep their streak — a user
preference (default 5). Surfaced on the study overview as a progress ring (items today / goal).

**Active day** (the streak unit):
A UTC day on which the learner reached their daily goal. Every graded card, answered
quiz/test question, solved match pair, and memorized verse counts one toward the day's tally;
reaching the goal makes the day _active_ and advances the streak. Practice **below** the goal
does not count (one streak-freeze forgives a single missed day).
_Avoid_: "training day".
