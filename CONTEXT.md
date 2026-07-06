# Mindscape

Mindscape is a phone-only memory-training app built on the method of loci. This glossary
fixes the domain language so the UI, copy, and code all name the same things the same way.

## Structure

**Palace**:
A place a learner builds to remember things, made of ordered rooms. Every practice mode
(the study session in any mode, Match, Test) is available on every palace; nothing is
gated by a palace "type". A palace carries a manual `order` for hand-sorting in the library.
_Avoid_: deck, set, collection (a Folder is the grouping above a Palace, not a Palace);
"Bible-mode"/"Scripture" palace as a distinct type (removed — verse study is always on).

**Folder**:
The one grouping above a Palace: a flat, hand-orderable container that holds palaces (and
**not** other folders — folders do not nest). A palace lives in at most one folder, or at the
library root (`folderId: null`). Deleting a folder unfiles its palaces back to the root; it
never deletes a palace. Both folders and palaces carry a manual `order`.
_Avoid_: nested folders/subfolders, "collection" (the old built-in chips — All/Favorites/
Bible/Unfiled — are gone), tag.

**Library**:
The home screen (`/`): a Windows-Explorer-style browse of the root level — folder cards and
unfiled palace cards together — that the learner reorders by drag (manual sort) or by an
automatic rule (recent/name/progress/category). Tapping a folder card enters it (`?folder=<id>`)
to show the palaces inside, where the same sort/view/select tools apply. Palaces and folders
are multi-selectable for bulk move/delete, the way cards are in the room editor.
_Avoid_: "collections rail", "filters row" (removed); calling the root a folder.

**Palace detail**:
The single screen for one palace (route `/palaces/:palaceId`): the place to create, rename,
reorder, and delete its ordered rooms. It leads with a **study overview** scoped to the whole
palace (cards for today aggregated across all its rooms, with a palace-wide Study action),
then the palace's **Practice entry** (one row into its Practice page), above its ordered
rooms.
Identity and progress live in the header and palace settings, not a hero card. Per-card
editing stays room-scoped; opening a room leaves this screen.
_Avoid_: palace page, palace screen, palace home; an identity/progress "hero" card (removed).

**Room**:
An ordered place inside a palace that holds its own loci. Rooms unlock sequentially.
_Avoid_: level, stage, chapter.

**Room hub**:
The single screen for one room (route `/rooms/:roomId`): one scroll that leads with the card
**preview** (carousel), then the **study overview**, then the **Practice entry** (one row
into the room's Practice page), then the room's cards-and-questions editor inline below. The place a learner lands
when they open a room.
_Avoid_: room detail, room page, room-content, Study/Manage tabs (the hub is one scroll, not
a segmented view); a "Study flashcards" launcher on the carousel (the carousel is preview-only,
the study overview owns the Study action).

**Flagged**:
A learner-set mark on a single card ("come back to this"). Independent of the SRS schedule
and of `memorized`.
_Avoid_: starred, bookmarked.

**Locus** (plural **loci**):
One memory spot inside a room — a single thing to recall. Surfaced to the learner as a
**card** (front = prompt, back = meaning). "Locus" is the domain/code term; "card" is the
user-facing word.
_Avoid_: item, entry, note, flashcard (use "card").

**Question**:
A multiple-choice item attached to a room, used by the Test/Quiz mode. Distinct from a
locus/card.
_Avoid_: prompt (the prompt is a field _on_ a question).

## Progress

The app has one progress model; these three words are NOT interchangeable.

**Reviewed**:
A locus is reviewed once it has left the "new" state (it has at least one successful rep).
This is the app-wide progress signal: it drives room completion, palace progress, and
sequential room unlocking, and it is the number the room hub headlines.
_Avoid_: mastered, learned, done (when you mean "reviewed", say "reviewed"/"practiced").

**Completed**:
A room is completed when every one of its loci is reviewed (an empty room is never
completed). Completion is what unlocks the next room.
_Avoid_: finished, mastered.

**Mastered / Known**:
A finer, stricter SRS status: a card whose interval has matured (≥ 21 days). It is texture
shown per-card and in the hub's status breakdown — it is NOT the headline progress number
and must never be labelled as the room's overall progress.
_Avoid_: using "mastered" for the headline reviewed-% (that conflates two different metrics).

**SRS status** (maturity):
The maturity bucket of a single card — exactly one, ordered **New → Learning → Known**:
`new` (never successfully reviewed), `learning` (reviewed, interval still short), `known`
(interval matured, ≥ 21 days). Maturity is independent of whether the card is due.
_Avoid_: treating `due` as a maturity bucket (it is the queue below, not a status).

**Cards for today** (the **due** queue):
Every card whose schedule has come up (`due ≤ now`), plus brand-new cards — a temporal
queue, NOT a maturity bucket. A Known card can still be "for today". It is the headline
count of the study overview and exactly what the Study action drills.
_Avoid_: "deck" for a room's card set (say "cards in this room"); calling due a status.

## Practice & streak

**Study overview**:
The per-surface daily-study panel: a headline _cards for today_ count, a New/Learning/Known
breakdown of that queue, and the **Study action**. On the room hub it is scoped to one room;
on palace detail it aggregates every room. The Study action opens the one **study session**
(see below) in Flip, in review mode — due cards lead — over the scope's whole set; when
nothing is due the action becomes _Study ahead_ over the same set. It sits apart from the card carousel,
which stays a visual preview.
_Avoid_: "today's training", "review hero", "up next" — the old home cards, removed.

**Study session** (the one flashcard surface):
A single full-featured session over a scope's cards (route `/rooms/:roomId/study` or
`/palaces/:palaceId/study`). Opens in review mode (due-first); the entry point sets the
**study mode** — the Study action opens Flip, a Practice row deep-links its own mode
(`?mode=`), and the header mode button switches it mid-session (Flip, Type, First letters,
Blur, Rebuild — every mode grades the same SRS deck). The remaining options live in the
in-session sheet: filter/range scope, in-study edit, orientation, shuffle, text-to-speech,
sort-into-piles. There is exactly one such surface — the old "train all cards", the stripped
"review", and the carousel's "Study flashcards" all collapsed into it. There is **no global
cross-library review**: study is always room- or palace-scoped.
_Avoid_: "train", "flashcard session", "review" as separate things — they are this one
session; "Verses" as a mode name (verse study generalized into the recall modes); a separate
page or engine per mode (the Practice rows are entries into this one session).

**Practice**:
The umbrella for every study activity that exercises memory: the study session (any mode),
the Match game, and the Test/Quiz. Each completed item is one unit of practice. The
**Practice page** (route `/rooms/:roomId/practice` or `/palaces/:palaceId/practice`) lists
every way to exercise the scope's set beyond the flip Study action, one full row per mode —
Type, First letters, Blur, Rebuild (each opens the study session preset to that mode),
Match, and Test. The room hub and palace detail reach it through their single **Practice
entry** row ("Practice cards").
_Avoid_: "training" as the streak verb (see _Active day_); "Recall"/"Memorize" as section
names (the flip session is Study, everything else is Practice); listing the full mode grid
on the hub surfaces (one entry row, the page owns the list).

**Daily goal**:
The number of practiced items a learner must reach in a day to keep their streak — a user
preference (default 5). Surfaced on the study overview as a progress ring (items today /
goal).

**Active day** (the streak unit):
A UTC day on which the learner reached their daily goal. Every graded card, answered
quiz/test question, solved match pair, and memorized verse counts one toward the day's
tally; reaching the goal makes the day _active_ and advances the streak. Practice **below**
the goal does not count — a day can lapse even after some practice (one streak-freeze still
forgives a single missed day).
_Avoid_: "training day" — the old rule (any finished session counted) is gone.
