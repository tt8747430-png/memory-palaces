# Review and improve the app in a loop

## Goal

Review and improve Mindscape round after round, starting from the ground up, until the usage runs out. When one round finishes, start the next on your own. Stop to ask only when a decision is genuinely the owner's.

## Context

- Repo `tt8747430-png/memory-palaces`, on the session's branch. Before starting, fetch and check that it is level with `main`.
- Read `CLAUDE.md` and load the `owner-way` skill first. It holds the owner's quality bar and workflow, and their past feedback by area.
- Before touching an area, read its ADR (`docs/adr/README.md`) and its lines in `docs/HISTORY.md`, so a fixed bug doesn't come back.
- Use the repo's skills where they fit: `code-review`, `diagnosing-bugs`, `tdd`, `impeccable`, `humanizer`, `vite-react-best-practices`, `vercel-react-best-practices`, `vercel-composition-patterns`, `supabase`.

## Task, each round

1. Pick an area not yet reviewed: a place and all its screens and widgets. Start with the Library (folders, decks, subdecks, archive, select mode, swipe actions), then the deck page, Study, deck settings and card styles, Profile and progress, Settings, Sync and account, the Bible extension, and the app shell (header, bottom nav, sheets, splash).
2. Review it for:
   - **Bugs:** verify each finding with a concrete failure scenario before fixing it.
   - **UI:** an iPhone (390×844 and 320×568) and a laptop (1280×800). Keyboard, safe areas and the status bar behave differently on iOS: use `/dev/kitchen-sink`'s viewport probe and CODE_STYLE's layout rules, and list what needs a check on a real device.
   - **States:** loading, error, empty and offline on every screen.
   - **Consistency** with the rest of the app and the glossary.
   - **AI-sounding text** in the UI and docs, rewritten plainly.
3. Fix every confirmed bug yourself, test first. Improve the area: you may refactor anything, change the UI and the architecture, and add features. Implement what is missing rather than leaving it out.
4. Use parallel worktree agents for large, separable work (briefs from `owner-way/references/agent-brief.md`), and do small or context-heavy work yourself.

## Constraints

- CLAUDE.md's change rules hold: no legacy code, but stored decks, cards and reviews must survive (migrate, never orphan).
- Run the full test suite once a round, on the merged branch, never after each edit.
- Keep the conversation under about 300k tokens. Size each round so it fits.

## Done means, each round

- Each fix is committed with a clear message.
- `npm run typecheck && npm run lint`, the full suite and `npm run build && npm run check:entry-graph` pass on the merged branch.
- The area's ADR, `docs/HISTORY.md`, the glossary and `CLAUDE.md` are updated.
- Pushed with `git push -u origin <branch> && git push origin HEAD:main`.

## Report, after each round

Briefly:

- what you fixed;
- what you left, and why;
- which decisions are the owner's;
- the running list of areas reviewed and areas left.

If the usage limit stops you, resume when the owner says "continue".
