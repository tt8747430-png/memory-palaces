# 06 — Closing a study session mid-way pays no XP
Status: resolved
Type: task

**Root cause.** `FlashcardsPanel` calls `onComplete` only when the reducer reaches `complete`; header ✕ calls
`onBack` directly. Card grades already persist per answer (`gradeCard`/`answerCard` save immediately).

**Fix.** ✕ with `graded > 0` → `onComplete({graded so far})` then back; `graded === 0` → plain back, no XP.
`studyXp(0)` must be 0, not the 20 floor.

## Answer
`FlashcardsPanel.leave()`: ✕ and the empty-queue Done hand `{graded, learning, known}` to `onComplete` when `graded > 0`, else `onBack`. `studyXp(0) = 0`. "Learned cards remain" was already true: every grade saves as given. Tests: `FlashcardsPanel.test.tsx` ×2, `rewards.test.ts`.
