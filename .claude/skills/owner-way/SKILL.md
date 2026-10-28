---
name: owner-way
description: How the owner of memory-palaces (Mindscape) wants work done — their quality bar, UI rules, workflow (rounds, parallel worktree agents, testing, merging to main), reporting style and the apps they compare against. Use it at the start of every session in this repo and whenever the owner sends feedback, screenshots, "continue", "improve", "review in a loop", asks for agents or rounds, or asks why something takes long — even when they don't name the skill.
---

# Working for the memory-palaces owner

The owner is building Mindscape, an offline-first study PWA (React 19, Vite, strict TS, FSD × Clean Architecture, RxDB, Supabase), to the standard of real, shipped apps. They write fast, often with typos, and send iPhone screenshots of our app and of apps they admire. Read through the typos for the intent; the screenshots are the spec.

`CLAUDE.md` binds every change and sets the answer style. This skill adds what the owner has said across sessions that CLAUDE.md doesn't spell out: how they judge the work and how they want it run. `references/feedback-log.md` holds their past feedback by area. Read an area's section before touching it, so you don't bring back something they already rejected. `docs/HISTORY.md` says what is built and what broke before.

## The quality bar

Compare against real apps, never against "good enough for a prototype":

| Area                                                 | Reference                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| Spaced repetition, algorithms                        | Anki: the right science, which we make pleasant                  |
| Study modes                                          | Quizlet's breadth                                                |
| Daily return, rewards, voice                         | Duolingo                                                         |
| Progress, streak and ring feedback                   | Apple Fitness                                                    |
| Craft, spacing, polish                               | Linear, Things                                                   |
| Reading and writing cards                            | Notion, Bear: calm and content-first                             |
| Card preview carousel                                | the iOS Photos app                                               |
| Deck settings, algorithm sheet, card actions, styles | the owner's screenshots of another flashcard app                 |
| Bible tracker, memorisation progress, reading        | the owner's screenshots of Bible apps                            |
| Status bar, header, footers over the scene           | the owner's screenshots; the status bar setup of `piano-trainer` |

When the owner points at a reference, study how that app actually behaves on a phone: its layout, its gestures, its names. Then come as close as our look allows. "Like this" means the layout, the interaction and the features, not a loose nod to them.

## Rules the owner holds every change to

These come straight from their feedback. Each has cost a round before.

**No half measures**

- Fix at the root, and check every place the same bug can occur, not only the one reported.
- Write down each class of bug you fix (CODE_STYLE, an ADR, a test) so it can't come back.
- One implementation of a thing, used everywhere: one order, one sort and filter, one header, one swipe engine. No duplicate logic.
- If something is missing, implement it rather than leaving it out. When you defer a part, say why and propose how to build it.
- Nothing the learner made is lost: progress survives closing mid-session, disabling an extension and moving decks; view state persists.

**Layout and motion**

- Only the sheet rises above the keyboard, never the whole app, and with no gap between them.
- No flicker, jumps or replayed animations: reorder, swipe, nav ↔ toolbar, progress bars, the search reveal.
- Only content scrolls. Headers and footers are fixed; a page that fits does not scroll; cards keep a fixed height.
- One header everywhere: fixed height, the same button sizes, the same select-mode header.
- The status bar always matches the header and screen, in light and dark, on the splash, under backdrops and toasts.
- Stacks and previews render the real cards and rows behind, never stubs.

**Surfaces and controls**

- Controls never blend into the background: real edges, shadows that render, buttons that look like buttons.
- Every control has room for all its states: focus ring, selected tint, animation poses.
- Offer only what applies: hide sorts, filters and actions that don't fit, and say why a control is disabled.
- Calm screens: one job per screen, depth behind progressive disclosure (`PRODUCT.md`).

**Asking**

- A redesign the owner proposed is checked with them before it is built ("consult me if it is a good proposal").
- What only an iPhone shows (keyboard, status bar, safe areas) is verified on the device or named as unverified, never claimed.

## How the owner wants work run

1. **Before starting:** fetch and check that the session's branch is level with `main`.
2. **Work in rounds, in a loop.** Keep going round after round without asking. Stop only for decisions that are genuinely the owner's, and put those as clear questions at the end of the report. When the owner says "continue", pick up exactly where the work stopped. Reusable prompts for this are in `prompts/`.
3. **Parallel agents for big rounds.** Use worktree agents (`isolation: "worktree"`), each with a brief built from `references/agent-brief.md`.
   - **Scope:** split by files so no two agents edit the same component. Keep a round small enough to finish in well under an hour.
   - **Screenshots:** copy the owner's screenshots into `scratchpad/<round>/owner/` with descriptive names, and describe each one in the brief, because agents can't see the chat.
   - **Mid-round feedback:** if the owner adds to a running agent's area, send it to that agent with SendMessage.
   - **Small fixes:** do them yourself; an agent needs the whole context re-explained.
4. **Testing** follows CLAUDE.md. Agents never run the full suite; you run it once on the merged result. Never run two suites at once. A test that fails only under load is made robust, and you say so.
5. **Commits:** one proper commit per finished task, saying what changed and why, ending with the session's attribution lines. Never a model ID in a commit.
6. **Merge and push:** once the merged suite, the build and `check:entry-graph` are green, update the docs, then `git push -u origin <branch> && git push origin HEAD:main`. Remove finished worktrees and their branches.
7. **Context:** keep it under about 300k tokens. Delegate file-heavy reading to agents.

## Reporting

CLAUDE.md's answer style rules: extremely concise, answer first. A report holds:

- what was built or fixed, in the owner's words for things (screens, controls), not file names;
- what was left and why;
- the decisions that are the owner's, as direct questions;
- the push state: branch, `main`, and whether tests and the build passed.

If agents are running and the owner asks, say so; never guess their results. If something takes long, say where the time goes and how to make it faster.

## Reference material

`memory_palaces_data/` holds the owner's reference material. The app never reads it; never import from it or ship it.

- `App Screenshots/`: screens of the app they compare against, by area (flashcards, match, questions, onboarding,
  completion screens, speed reader), and `bugs/` for bugs they photographed.
- `Projects/`: the planned extensions: the Bible screens (add cards, reading, tracker, memorisation progress), an earlier
  AI tutor screen and a palace-journey project. Read code there for behaviour only.

Look at the screenshots for an area before building it, and describe the ones you use in an agent's brief.

## Docs to update each round

- **ADRs:** amend the area's record (`docs/adr/README.md`): the decision as it stands now, one line in its History. A new record only for a new area.
- **`docs/HISTORY.md`:** a Built line per feature, a Fixed line per bug (symptom, cause, what holds it).
- **Glossary:** rows in `docs/UBIQUITOUS_LANGUAGE.md`.
- **`CLAUDE.md`:** kept current at the merge: rename what was renamed, drop what was deleted. It stays a map, never an inventory.
- **`feedback-log.md`:** fold in the owner's new feedback by area.
