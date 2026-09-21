# Bug sweep 2026-09 — grouped and concretised

Source: `docs/2.Bugs.md` (BUGS section, 2026-09-21). Grouped by subsystem; each issue file carries root cause,
fix, and status. Order: F → E1 → E2 → D1 → C1 → A1 → A2 → (repro) C2, A3 → D2 → G → B → H.

| # | Group | Issue | Status |
|---|-------|-------|--------|
| 01 | F Initials | `wordInitial` doubles a connector-only token (`–` → `––`) | resolved |
| 02 | E1 Header search | focus ring clipped at bar edge / overlaps ✕ | resolved |
| 03 | E2 Sync banner | success surface has no edge on the page gradient | resolved |
| 04 | D1 Card style | `frost` face is translucent; stack bleeds through | resolved |
| 05 | C1 Preview stack | swipe-back shows the *next* card behind | resolved |
| 06 | A1 XP on close | closing a session mid-way pays no XP | resolved |
| 07 | A2 Study from card | picked card leads, then queue reverts to due/new order | resolved |
| 08 | C2 Swipe rail | tapping a rail action does nothing (deck detail) | resolved |
| 09 | A3 Fast review | "does not work / does not save" | resolved |
| 10 | D2 Card style dark | presets ignore the dark theme | resolved |
| 11 | G Bible corpus | verses are per-user; "JWT" errors | resolved (migration awaiting apply) |
| 12 | B Reading mode | new 5th study mode | needs-triage (spec) |
| 13 | H Review | ThemeProvider + notification path review | resolved (findings in 13) |

Rules to document (CODE_STYLE §5): ring/active footprint reserved by every control; surfaces on the page gradient
need an edge; card faces are opaque; swipe rails get a tray-tap test.

## Review round (2026-09-21)

Two-axis review (`/code-review`, standards + spec as parallel agents) against `HEAD` = dd52a5fa.
Standards: 4 hard + 7 judgement calls. Spec: 9 findings. Three defects were found by both axes
independently (a dead `isCaughtUp`, the missing tombstone backfill, the per-account Realtime
filter). Everything below was fixed in the same working tree; two were decided differently from
the reviewers' suggestion, and both are recorded as decisions rather than omissions.

| Finding | Where | Outcome |
|---|---|---|
| §12: state set from a motion value per frame | `use-card-browser.ts` | Both stacks derived without state; the view cross-fades them from `x` (`CardBrowser.BehindStack`) |
| `isCaughtUp` computed, never read | `study-overview.ts`, `StudyOverviewCard` | `caughtUp` is a prop now; an all-frozen deck no longer claims "Every card got right" |
| Tinted borders absent from the scene blocks | `tokens.css`, `presets.ts` | The four `--*-border` joined `CHROME_TOKENS` and both `[data-scene]` blocks |
| Pre-migration tombstones would delete a book for everyone | migration | `update … set deleted = false where deleted` |
| The hit-testing rule was claimed but never written | `CODE_STYLE.md` §5 | "Invisible is not absent" written, with the tray-tap testing rule |
| Search ring 3px from the screen edge | `HeaderSearch.tsx` | Gutter is the bar's plus the ring (`left-3 right-3`), with a test |
| A tinted hero with no edge | `StreakPage.tsx` | Border added — the audit the rule asked for |
| The library badge contradicted the deck page | `deck-tree.ts` + both callers | The roll-up takes each deck's algorithm; a fast deck counts what is left to get right |
| A run followed store order, not the learner's sort | `StudyCardsPage.tsx` | The session is built from the deck list's sort, with a page-level test |
| Pure logic + a view formatter in a commands slice | `features/sync` → `shared/lib` | `authFailure` and `syncFailureMessage` moved |
| `scheme = 'light'` and `refreshAuth?` fallbacks | card-style, `SyncDeps` | Both required; every caller names what it means |
| Two sources of truth for the status bar | `index.html`, `theme-color.ts` | `theme-color.test.ts` pins the pre-paint copy to the module |
| Twin `variant === 'fast'` ternaries | `StudyOverviewCard` | One `DONE` map |
| `useColorScheme()` at the provider root | `AppProviders` | A `ThemedToaster` keeps the subscription local |

**Decided, not fixed:**
- **Fast review pays only for cards got right.** The user's call: a pass of "not quite" answers
  earns nothing, so `graded` counting only `gotIt` is the intended behaviour.
- **The corpus raises no Realtime event.** Suggested: widen the watcher past `user_id`. Refused:
  what that watcher feeds is "this account changed on another device", and a book being published
  is not that. The corpus arrives with the next Sync; `cloud-watcher.ts` says so.
