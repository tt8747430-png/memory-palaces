# An agent's brief

Write one brief per agent into the session's scratchpad (`briefs/<round>-<area>.md`). Start with its own part:

1. **Opening line:** the job in one line, and that it works in its own worktree.
2. **Docs:** the ADR to amend, the ADRs to read first, the area's lines in `docs/HISTORY.md` and its section in `feedback-log.md`.
3. **Boundaries:** what other agents are changing at the same time. Name those files and tell it to stay out.
4. **The owner's screenshots:** their paths in `scratchpad/<round>/owner/`, each described in a line or two (what it shows, which app). The agent can't see the chat.
5. **The owner's words:** quoted verbatim.
6. **Build:** numbered items, each concrete and checkable. Name the components, features and model functions involved. Say "decide and say why in the ADR" where a design choice is the agent's.
7. **Screens to shoot.**

Then append the common part below, with the session's branch and attribution lines filled in. Launch with `isolation: "worktree"` and a one-line prompt pointing at the brief's path and a free dev-server port (5191, 5192, …).

---

## Setup

- If `node_modules` is missing in your worktree, run `ln -s /home/user/memory-palaces/node_modules node_modules`. Do not run `npm install`, because the folder is shared. If you need a package, say so in your report.
- Run `git merge <session branch>` first. That branch holds every round before yours.
- Read these first:
  - `CLAUDE.md`, whose rules bind you;
  - `docs/CODE_STYLE.md` and `docs/UBIQUITOUS_LANGUAGE.md`;
  - the round's spec in `.scratch/<feature>/spec.md`, if it has one;
  - the ADR of each area your round changes (`docs/adr/README.md` lists them) and any other your brief names.

## The owner's standing rules

- The quality of real, shipped apps.
- No legacy code or duplication. Stored decks, cards and reviews survive: migrate, never orphan.
- One implementation of a thing, used the same way on every screen.
- Every screen handles loading, error, empty and offline.
- Sheets and dialogs sit above the keyboard; nothing jumps, flickers or moves the header.

## Process

- Write tests first.
- Make small commits, each ending with exactly the session's two attribution lines (`Co-Authored-By: …`, `Claude-Session: …`).
- Never run `npm run format`. Use `npx prettier --write <files you touched>`.
- Never `git checkout`, `restore`, `stash` or `reset` what you did not create. Do not push.
- Commit each task as soon as it is finished, its message saying what changed and why. Before each commit `npm run typecheck && npm run lint` is enough. When the round is finished, run only the tests your changes reach (`npx vitest run <test files>` or `npx vitest related <changed source files> --run`) and fix what fails. Never run the full `npm run test`: it runs once, on the merged branch. Run `npm run build && npm run check:entry-graph` only if you touched startup, imports, routing, the PWA or config.
- Before you report, merge the session branch again if it moved, and resolve any conflicts.
- Amend the ADR of the area you changed: its decision as it stands now, and one line in its History. Write a new ADR only for a new area, and add it to `docs/adr/README.md`. Add a line to `docs/HISTORY.md` for what you built or fixed, and the glossary rows. Do not edit `CLAUDE.md`; it is updated at the merge.
- Put every string in the English locale (`shared/i18n/locales/en/`, one file per domain).
- Screenshots:
  - Run a dev server with `npx vite --port <your port> --strictPort` in the background.
  - Use Playwright: `require('playwright')`, `chromium.launch()` (the browser is preinstalled; if a project pin can't find it, pass `executablePath: '/opt/pw-browsers/chromium'`), deviceScaleFactor 2.
  - Shoot each screen your brief lists at 390×844 and 1280×800; add 320×568 where something may be clipped.
  - Look at every shot and fix what is cut, crowded or misaligned. Name what only a real iPhone can confirm (keyboard, status bar, safe areas).

## Report back (under 500 words)

- What you built, file by file.
- The commits.
- The test results.
- The screenshot paths.
- Your decisions.
