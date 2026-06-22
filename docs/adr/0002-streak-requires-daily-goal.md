# Streak requires meeting a daily goal

Previously any finished session marked the day as trained and advanced the streak. We changed
this so a day becomes **active** — and only then advances the streak — once the learner reaches
a **daily goal**: a configurable number of practiced items (a Preferences value, default 5),
where every graded card, answered quiz/test question, solved match pair, and memorized verse
counts one. We did this to make the streak mean sustained daily practice rather than a single
tap, which is the habit the product is built around.

## Consequences

- Practice **below** the goal does not count, so a learner can practice and still lose the day
  (the existing single-day streak-freeze still forgives one miss). This friction is intentional;
  the alternative (any practice keeps the streak, goal is a cosmetic bonus) was rejected because
  it doesn't ask for the daily volume the feature is meant to build.
- `Progress` now carries a per-UTC-day tally (`activeDayKey` / `activeDayCount`) so the running
  count survives app restarts within the day; `completeSession` takes an items-practiced count
  and reads the goal. Days recorded under the old rule remain as-is (not recomputed).
