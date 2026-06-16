# CLAUDE.md

Guidance for working in the **Mindscape new-architecture rewrite** (FSD + Clean/Hexagonal).
Stack: React 19 + Vite + TanStack Router + Zustand + Tailwind v4 + RxDB (planned) +
Supabase (planned), strict TS, PWA. See `README.md` and the roadmap at
`../memory-palaces-app-ui/docs/ai_docs/NEW_ARCHITECHTURE.md`.

## Product / platform

This repo **is the Mindscape mobile app**: a mobile-first, phone-only PWA. Design every
screen for touch on a phone (44px+ targets, `whileTap`/spring feedback, native-feeling
gestures — swipe actions, kebab `⋮` overflow menus, pull-to-refresh, long-press quick
actions). Do not design for desktop/tablet layouts.

The sibling `../memory-palaces-app-ui` is the **previous SPA, kept only as the visual/
design reference** ("The Lucid Atrium" look). Port its craft into `shared/ui` + the
home/palace/notification widgets here; never ship product features back into it.

## Architecture rule

FSD layers import only downward: `app → pages → widgets → features → entities → shared`
(lint-enforced via eslint-plugin-boundaries). Persistence is behind the `Repository<T>`
port in `shared/api`, wired at the composition root — never import a concrete adapter
into entities/features.

## Code style

- **Comment only when it adds value.** Explain _why_ — non-obvious intent, trade-offs,
  gotchas — not _what_ the code already states. Don't narrate obvious code, restate
  signatures, or leave TODO/placeholder noise. Prefer clear names and small functions
  over explanatory comments, and delete comments that no longer match the code. Keep
  the codebase clean — do not pollute it with redundant comments.
- **Naming:** intent-revealing names over abbreviations. Components/types `PascalCase`,
  variables/functions `camelCase`, hooks `useX`, true constants `UPPER_SNAKE`. Booleans
  read as predicates (`isDue`, `hasSession`); features/commands are verbs (`createPalace`,
  `gradeCard`); event handlers are `handleX`. Mirror the domain vocabulary (`Palace`,
  `Room`, `Locus`, `Session`).
- **Types:** never `any` (strict + `noUncheckedIndexedAccess` are on); model shapes
  precisely. Prefer discriminated unions for state machines (review/quiz/tutor turns)
  and entity variants. Type a module's public surface; let locals infer.
- **Functions:** small, single-responsibility, early-return. Domain logic in
  `shared/lib` + `entities/*/model` stays pure (no React/IO) — inject the clock, don't
  read `Date.now()` inline. Side effects live in features/adapters.
- **Immutability:** default to `const`; never mutate Zustand state in place — return
  new state. Entity copies go through the `clone()` factories, not ad-hoc spreads.
- **No magic values:** name constants in `shared/config`; route ids and storage keys
  are defined once there.
- **Imports:** use the `@/` alias and respect FSD direction — never import upward or
  sideways across slices; cross-cutting code belongs in `shared`. Never import a
  concrete adapter into `entities`/`features` — depend on the port.
- **DRY, but no premature abstraction:** one command per mutation (UI + tutor reuse it);
  don't abstract until the pattern actually repeats.

## Commands

`npm run dev` · `npm run build` · `npm run typecheck` · `npm run test` · `npm run lint`
