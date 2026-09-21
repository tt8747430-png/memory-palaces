# 07 — "Study from this card" continues 1, 2… instead of 15, 16…
Status: resolved
Type: task

**Root cause.** `features/review/study-filter.ts` `buildStudyQueue` keeps due+new only, then `leadWith` moves
the picked card to the front — the rest is the due order.

**Fix.** With `startAt`: queue = deck order from that card to the end (frozen skipped), no due/new limit, no
shuffle. Assumption: no wrap-around to the cards before it (a second "study from" reaches them).

## Answer
`buildStudyQueue` with `startAt` returns the run: that card + every unfrozen card after it in store (manual) order, no due/new allowance, no shuffle, `maxCardsPerDay` still caps. No wrap-around. `leadWith` removed. Tests: `study-filter.test.ts` ×6.
