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
which it is the place to create, rename, reorder, and delete. Room-level study (cards,
modes, schedule) lives in the room hub, not here; opening a room leaves this screen.
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

**SRS status**:
The coarse bucket of a single card's schedule: `new`, `due`, `learning`, or `known`.
