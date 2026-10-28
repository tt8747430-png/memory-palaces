# Make the docs concise and current

First run October 2026. Run it again whenever the docs have drifted: new specs or bug lists in `docs/`, ADRs that grew a second record per area, finished issues in `.scratch/`, a CLAUDE.md that lists what the code already shows.

## Goal

The documentation is short, current and in one place per topic. Every rule that still binds is kept and checked against the code. Nothing stale, duplicated, finished or unused is left: no old specs, bug lists, status notes or stray prompts in `docs/`, no done issues in `.scratch/`, no skills the repo never uses.

## Context

- Work on the session's branch. First fetch and check that it is level with `main`.
- Read `CLAUDE.md`, load the `owner-way` skill, then read every file in `docs/`, `prompts/` and `.scratch/`.
- **Where things live** (keep it this way):

  | File                          | Holds                                                                    |
  | ----------------------------- | ------------------------------------------------------------------------ |
  | `CLAUDE.md`                   | the repo's binding rules, layers, map, commands, read-before-you-touch   |
  | `.claude/skills/owner-way/`   | the owner's preferences, workflow, reference apps, feedback by area      |
  | `docs/adr/` + `README.md`     | one current record per decision area, with its History                   |
  | `docs/CODE_STYLE.md`          | how code is written: TS, React, UI kit, layout and mobile, motion, tests |
  | `docs/UBIQUITOUS_LANGUAGE.md` | one line per domain term                                                 |
  | `docs/HISTORY.md`             | what is built (by area) and what was fixed (symptom, cause, holder)      |
  | `docs/agents/`                | how skills use the tracker, labels and domain docs                       |
  | `.scratch/`                   | open issues and specs only                                               |
  | `prompts/`                    | reusable prompts in the shape `prompts/README.md` gives                  |
  | `PRODUCT.md`, `README.md`     | what the app is for; how to run it                                       |

- **Skills to use:** `humanizer` and `writing-guidelines` for every doc you write; `codebase-design` and `domain-modeling` to judge what an ADR or the glossary should hold.

## Task

Run it as parallel worktree agents, split by files so no two edit the same doc (briefs from `owner-way/references/agent-brief.md`, adapted to a docs round). A good split: (1) ADRs, specs, bugs, `.scratch`, HISTORY; (2) CLAUDE.md, PRODUCT.md, README, `docs/agents/`; (3) CODE_STYLE and the glossary; (4) you: prompts, skills, the owner's skill and repo clutter, and the cross-doc links at the merge.

1. **ADRs.** One record per area as it decides today: context, the decision now, consequences, a short History. Fold any newer spec or ADR into its area's record and delete it. A record keeps the number of an earlier record of its area, so old citations hold. If a number goes, map old → new and rewrite citations in code comments and docs with a small script, then grep that none points at a deleted record. Keep `docs/adr/README.md` one line per record.
2. **Specs, plans, status notes** added since the last run: fold still-true rules into the right ADR or doc, record what they built in HISTORY, delete them.
3. **Bugs and issues.** A bug list in `docs/` becomes one issue file per open bug in `.scratch/` (`docs/agents/issue-tracker.md`). Each done or obsolete issue gets its HISTORY line, then is deleted.
4. **HISTORY.** Built: by area, one line per feature as it stands now, with its ADR. Fixed: symptom, cause, and the test or rule that holds it, newest first, repeats of one cause folded. Check each line against `src/`: removed features go, moved fixes point to where they live now.
5. **CLAUDE.md.** Check every line against `src/`. Keep the rules that bind, the layers and import fences, a short map, the commands, test conventions and the read-before-you-touch list. Drop inventories, history and anything stale. Keep the owner's own words exactly, starting with "Be extremely concise. Sacrifice grammar for the sake of concision."
6. **CODE_STYLE.** The one place for how code is written. Cut what the ADRs already explain; link instead. Fold in coding rules new fixes taught.
7. **Glossary.** One line per term: meaning, code name where it differs, words to avoid. Drop terms of removed features (grep `src/` and the locales).
8. **PRODUCT.md and README.** Check against the app as it is now.
9. **Prompts.** Any raw prompt left in `docs/` becomes a structured file in `prompts/`; a request already built becomes a regression check in `check-early-requests.md`. Keep `prompts/README.md`'s index current.
10. **Skills and clutter.** Remove skills this repo never uses from `.claude/skills`, `.agents/skills` and `skills-lock.json` (judge by this repo; Supabase is used). Remove tracked logs, build output and mockups whose direction is recorded. **Ask before deleting** data the app doesn't read but the owner may want.
11. **The owner's skill.** Keep `owner-way` free of repo rules (those are CLAUDE.md's) and fold new owner feedback into `references/feedback-log.md` by area.

## Constraints

- A documentation round: no app behaviour changes; only comments change in code.
- Plain words and short sentences. Say each rule once, in the one doc it belongs to, and link instead of repeating.
- Describe the code as it is now. A claim you can't confirm in `src/` goes, or is marked as an open question.
- Agents commit each finished task, run `typecheck` and `lint` only, never the full suite. Never `npm run format`; prettier only on the files you touched, never on CLAUDE.md.

## Done means

- Every doc is rewritten, merged or deleted, and every Markdown link resolves.
- Every built feature and fixed bug from deleted files has its HISTORY line.
- No code comment cites a deleted ADR or doc.
- On the merged branch, `npm run typecheck && npm run lint`, the full suite, `npm run build` and `npm run check:entry-graph` pass once.
- The branch is pushed and merged to `main`.

## Report

- A size table, before → after for each doc, and the ADR count.
- What was deleted and where anything still true went; HISTORY's built and fixed line counts.
- The open issues kept in `.scratch/`.
- The skills removed.
- The questions that are the owner's.
