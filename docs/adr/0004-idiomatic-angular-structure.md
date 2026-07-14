# ADR-0004: Full idiomatic Angular restructure — FSD dissolves into feature domains

**Status:** Accepted
**Date:** 2026-07-15
**Context:** The migration is a *complete* refactoring (owner's decision): not only the framework machinery but the folder architecture itself. The FSD layer system (`app → pages → widgets → features → entities → shared`) was React-era structure; the Angular app follows the Angular style guide's organize-by-feature-area layout.

## Decision

### Structure

```
src/app/
  decks/           ← deck library, deck detail, deck settings, tree, card/question editors + deck domain store/commands
  study/           ← study session, review flow
  practice/        ← quiz, match
  progress/        ← achievements, badges, streak, stats pages
  auth/            ← login, signup, forgot-password, guards
  settings/        ← all settings pages
  notifications/
  import/          ← paste-notes, import-review
  shared/
    domain/        ← srs, streak, stats, recall, deck-tree, achievements, badges, order, naming (pure TS + colocated tests, ported verbatim)
    data/          ← RxDB database + schemas, Repository<T> port, RxDB + in-memory adapters
    ui/            ← theme setup (Material/PrimeNG/Taiga token bridge), SwipeRow directive, overlay z-index contract
  app.routes.ts    ← lazy-loaded routes per feature area
```

### Machinery translation

| React-era | Angular |
|---|---|
| Zustand store factory + `repo.observe()` subscription | Signal-based store service per entity (`@Injectable({providedIn:'root'})`); RxDB observable → `toSignal()` |
| `model/selectors.ts` | `computed()` on the store service |
| React context + `useXStore()` hooks | Native DI — `inject(DeckStore)`; the context layer disappears |
| Composition root + `ServicesProvider` | Angular DI providers; repositories bound via `InjectionToken<Repository<T>>` so tests swap in the in-memory adapter |
| Feature commands `createDeck(store, input)` | Kept: one use-case per file, functions taking the injected store — CQRS-lite survives inside each feature area |
| Entity `model/types.ts` factories/invariants | Ported verbatim into the owning feature area (pure TS) |
| Pages | Lazy-loaded routed standalone components |

## Consequences

- `eslint-plugin-boundaries` FSD layer rules retire with the layers; Angular ESLint takes over. A minimal boundary rule survives: `shared/` must not import from feature areas.
- `docs/UBIQUITOUS_LANGUAGE.md` vocabulary (Deck, Card, Question, Review, Study session…) is unaffected and continues to name folders, symbols, and commits.
- CLAUDE.md and architecture docs must be rewritten as part of the migration (they currently document FSD).
