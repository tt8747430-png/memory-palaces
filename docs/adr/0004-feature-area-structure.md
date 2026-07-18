# ADR-0004: Feature-area structure — FSD dissolves into feature domains

**Status:** Accepted
**Date:** 2026-07-15
**Amended:** 2026-07-18 — re-expressed in React terms after ADR-0013 (the Angular revert). The
structure decision itself is unchanged and survived the framework change intact; only the machinery
column below was rewritten.

**Context:** The FSD layer system (`app → pages → widgets → features → entities → shared`) organised
code by _technical role_, so a single feature's parts scattered across six top-level folders and
every change touched all of them. The replacement organises by _feature area_ — the thing the code is
about — with Clean Architecture layers living inside each area.

## Decision

### Structure

```
src/
  decks/           ← deck library, deck detail, deck settings, tree, card/question editors
  study/           ← study session, review flow
  practice/        ← quiz, match
  progress/        ← achievements, badges, streak, stats
  auth/            ← login, signup, forgot-password, guards
  settings/        ← all settings pages
  notifications/
  import/          ← paste-notes, import-review
  shared/
    domain/        ← srs, streak, stats, recall, deck-tree, achievements, badges, order, naming
                     (pure TS + colocated tests)
    data/          ← Repository<T> port, RxDB + in-memory adapters, store base classes
    lib/           ← reusable React hooks (use-long-press, use-optimistic-patch, sticky-header…)
    ui/            ← the design system
    config/        ← routes, constants
  shell/           ← app chrome: nav, providers, splash, theme, update prompt
  composition-root.ts  ← builds every store over its adapter, starts them once
  routes.tsx           ← lazy routes per area
```

Inside an area: `model/` (entity types + factories/invariants, pure TS), `data/` (stores + schemas),
`commands/` (one use-case per file, all writes), `pages/` (routed components + their VM hooks), `ui/`
(components the area owns). Not every area needs every folder — `import/` is commands only.

### The one boundary rule

`shared/` must never import from a feature area. Enforced by `eslint-plugin-boundaries` in
`eslint.config.js`; everything else is convention, because a rule per layer is what made FSD
expensive.

### Machinery

| Concern          | Implementation                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Entity store     | A class per entity extending `CollectionStore<T>` / `SingletonDocStore<T>` (`shared/data/`), built over a `Repository<T>`          |
| Reactivity       | `Observable<T>` (`shared/data/observable.ts`) — framework-agnostic, callable like a signal (`store.decks()`)                       |
| React binding    | `useStore(observable)` (`shared/data/use-store.ts`), a one-line `useSyncExternalStore` seam — the _only_ place React meets a store |
| Selectors        | Derived observables on the store                                                                                                   |
| Ports & adapters | `Repository<T>` bound to `RxdbRepository` in production, `InMemoryRepository` in tests                                             |
| Composition root | `composition-root.ts` — `createServices()` / `createTestServices()`, the single swap seam                                          |
| DI               | `ServicesProvider` (`shell/services-provider.tsx`) + per-store hooks; no framework DI container                                    |
| Commands         | One use-case per file, plain async functions taking the store: `createDeck(store, input)`                                          |

## Consequences

- Cross-area imports go through an area's `index.ts` barrel; intra-area imports stay relative.
- `docs/UBIQUITOUS_LANGUAGE.md` vocabulary (Deck, Card, Question, Review, Study session…) names
  folders, symbols, and commits, and is unaffected by structure changes.
- The domain core, commands, and stores are framework-agnostic by construction. This was designed as
  layering discipline, not portability — but it is what let ~7,600 lines cross the Angular→React
  revert (ADR-0013) untouched.
