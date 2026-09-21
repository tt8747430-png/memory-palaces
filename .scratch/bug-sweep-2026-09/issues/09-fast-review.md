# 09 — Fast review "does not work / does not save"
Status: resolved
Type: task

Reading: `answerCard` saves `fastReview` + history at once; the queue is *all* live cards every session (never
narrows to notQuite); the overview count is `min(live, maxPerDay)` and never moves. Need: what fails —
buttons, advancing, counts, another device.

## Answer
The writes were never the problem — `answerCard` saves `fastReview` + a history entry at once, and
`review-commands.test.ts` already covered it. Fast review had **no memory**: `buildStudyQueue`
offered every live card every session, in the same order, and `fastOverview.count` was
`min(live, maxPerDay)` — so answering changed nothing the learner could see.

Fix: a Fast pass remembers. The queue offers the cards not yet `gotIt` (not studied + not quite);
when every card has been got right the pass is complete and the next one starts over. The overview
counts what is left rather than the size of the deck, and reports `isCaughtUp`; the card then says
"Every card got right" and offers "Study again". Tests: `study-filter.test.ts` ×2,
`study-overview.test.ts` ×2, `StudyOverviewCard.test.tsx` ×2.
