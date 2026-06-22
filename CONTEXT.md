# Mindscape

Mindscape is a phone-only memory-training app built on the method of loci. This glossary
fixes the domain language so the UI, copy, and code all name the same things the same way.

## Structure

**Palace**:
A place a learner builds to remember things, made of ordered rooms. A palace may be a
_Bible-mode_ palace, in which every locus is a verse and the verse-study modes unlock.
_Avoid_: deck, set, collection (a Folder is the grouping above a Palace, not a Palace).

**Palace detail**:
The single screen for one palace (route `/palaces/:palaceId`): the palace's overview —
identity, derived progress, and the palace-level quiz — sitting above its ordered rooms,
which it is the place to create, rename, reorder, and delete. It leads with a **study
overview** scoped to the whole palace (cards for today aggregated across all its rooms,
with a palace-wide Study action). Per-card editing and the card carousel stay room-scoped;
opening a room leaves this screen.
_Avoid_: palace page, palace screen, palace home.

**Room**:
An ordered place inside a palace that holds its own loci. Rooms unlock sequentially.
_Avoid_: level, stage, chapter.

**Room hub**:
The single screen for one room (route `/rooms/:roomId`): one scroll that leads with the
progress hero, a card preview, and the study modes, then the room's cards-and-questions
editor inline below. The place a learner lands when they open a room.
_Avoid_: room detail, room page, room-content, Study/Manage tabs (the hub is one scroll, not
a segmented view).

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
breakdown of that queue, and the **Study action**. On the room hub it is scoped to one room
and drills that room's due cards; on palace detail it aggregates every room and drills the
whole palace's due queue. When nothing is due the action becomes _Study ahead_ (practice the
full set early). It sits apart from the card carousel, which stays a visual preview.
_Avoid_: "today's training", "review hero", "up next" — the old home cards, removed.

**Practice**:
The umbrella for every study activity that exercises memory: flashcard review/train, the
Match game, the Test/Quiz, and verse memorization. Each completed item is one unit of
practice.
_Avoid_: "training" as the streak verb (see _Active day_).

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
