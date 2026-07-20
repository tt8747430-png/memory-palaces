# Mindscape — Your Memory Palace

An offline-first PWA for memory-palace study and spaced repetition. Build decks, drill them with
flashcards and quizzes, and let the SRS scheduler decide what you see next — all on-device, with no
account required.

**React 19 + TypeScript on Vite.** RxDB (IndexedDB) is the source of truth; the app works fully
offline and installs to the home screen.

## Getting started

Requires Node **≥ 22.22** (see `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:5173
```

## Scripts

| Command                     | What it does                                              |
| --------------------------- | --------------------------------------------------------- |
| `npm run dev` / `npm start` | Vite dev server                                           |
| `npm run build`             | Typecheck, then production build to `dist/`               |
| `npm run preview`           | Serve the built output — use this before trusting a build |
| `npm run typecheck`         | `tsc --noEmit`                                            |
| `npm run lint`              | ESLint                                                    |
| `npm run test`              | Vitest (single run) · `npm run test:watch` to watch       |
| `npm run format`            | Prettier over the repo                                    |

Run one spec directly — the `@/*` alias resolves through `vite.config.ts`:

```bash
npx vitest run src/shared/domain/srs.spec.ts
```

## Architecture

Code is organized by **feature area**, with Clean Architecture layers inside each one:

```text
src/
  decks/  study/  practice/  progress/  auth/  settings/  notifications/  import/
    model/     ← entity types + invariants (pure TS)
    data/      ← stores + RxDB schemas
    commands/  ← one use-case per file; all writes
    pages/     ← routed components + their ViewModel hooks
    ui/        ← components the area owns
  shared/      ← domain algorithms, repository ports/adapters, hooks, design system
  shell/       ← app chrome: nav, providers, theme, update prompt
```

The domain core, commands, and stores carry **no framework imports**. Reads flow through store
observables bound into React by a single `useSyncExternalStore` seam; writes flow through commands.
The composition root swaps RxDB adapters for in-memory ones in tests.

## Documentation

| Doc                                                          | Contents                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| [`CLAUDE.md`](CLAUDE.md)                                     | How to work in this codebase — architecture, conventions, commands |
| [`PRODUCT.md`](PRODUCT.md)                                   | What the product is and who it's for                               |
| [`docs/CODE_STYLE.md`](docs/CODE_STYLE.md)                   | Component, hook, Tailwind, performance, and drag-and-drop rules    |
| [`docs/MOBILE_DESIGN.md`](docs/MOBILE_DESIGN.md)             | Mobile behavior, gestures, safe areas, PWA caveats                 |
| [`docs/UBIQUITOUS_LANGUAGE.md`](docs/UBIQUITOUS_LANGUAGE.md) | Canonical domain vocabulary                                        |
| [`docs/adr/`](docs/adr/)                                     | Architecture decision records                                      |

## Status

The View layer is being rebuilt after a reverted Angular migration ([ADR-0013](docs/adr/0013-return-to-react.md)).
The framework-agnostic core is complete and tested; the shell and deck library are ported, and the
remaining pages are in progress.

## License

See [LICENSE](LICENSE).
