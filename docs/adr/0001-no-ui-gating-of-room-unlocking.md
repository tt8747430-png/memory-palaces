# The UI does not gate sequential room unlocking

`CONTEXT.md` defines rooms as unlocking sequentially ("Completion is what unlocks the
next room"), and `shared/lib/stats.ts` exposes `isRoomUnlocked` for it. We deliberately
do **not** surface or enforce that gate in the UI: on the palace-detail screen every room
is openable in any order, with no locked/unlocked chrome. Sequential unlocking remains a
conceptual model (the "current room" is still the first incomplete one, used for a
"Continue" affordance), but it is guidance, never a wall.

This resolves a standing tension between two of our own documents. PRODUCT.md's principles
are "guest-first, no walls" and "guide the user to the calmest sensible next step"; a hard
gate contradicts both and can trap a learner behind a single stubborn card. We keep the
journey's *shape* (order, completion ✓, a suggested next room) and drop the *gate*.

A future reader will find `isRoomUnlocked` defined but unused and wonder why — this is the
answer. If we ever want gating back (e.g. an opt-in "guided mode"), it should be an
explicit, escapable choice, not the default.
