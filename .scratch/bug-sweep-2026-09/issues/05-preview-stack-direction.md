# 05 — Deck-detail preview: swiping back shows the next card behind
Status: resolved
Type: task

**Root cause.** `widgets/content-editor/model/use-card-browser.ts` returns `ahead = cards.slice(index+1, …)`
regardless of drag direction.

**Fix.** The stack follows the drag: `x > 0` (going back) → previous cards behind; else next. `CardBrowser`
renders whichever the hook returns.

## Answer
`useCardBrowser` exposes `behind` (was `ahead`), derived from the card's `x`: `x > 0` → previous cards nearest-first, else next. `go(-1)` now promotes from behind like `go(1)`; the `'edge'` entry pose and `offscreen` export are gone. Tests: `use-card-browser.test.ts`.
