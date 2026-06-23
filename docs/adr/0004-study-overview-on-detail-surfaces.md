# The daily-study overview lives on palace/room detail, not the home

> **Partially superseded by [ADR-0005](0005-one-scoped-study-session-no-global-review.md):**
> the global "review everything due" is now removed entirely (not parked on the Streak page),
> and the palace-detail identity/progress hero is dropped. The detail study overviews below
> still stand.


The home (palaces) screen owned the daily loop via a `TodayTrainingCard` (cross-palace review
launcher) and an `UpNextCard`. We removed both. The daily-study overview now lives where the
content does: **palace detail** shows an aggregate "cards for today" across all its rooms with a
palace-scoped Study action, and the **room hub** shows the same scoped to one room. The home
becomes browse-only, with a compact streak + daily-goal ring in its header, and the global
"review everything due" entry point moves to the Streak page. We did this so study is reached by
drilling into the thing you want to study, and each surface answers "what do I do here today?".

## Consequences

- There is no single home review hub anymore; a reader expecting one should look at the Streak
  page (global review) or any palace/room (scoped review).
- "Study" is due-only and scoped; the prior whole-room "train all cards" session survives as the
  **Study ahead** path used when nothing is due.
