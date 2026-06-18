# Mindscape — Your Memory Palace

A phone-first, **offline-first PWA** for memory training with the method of loci.
Rewrite of the original app into **Feature-Sliced Design × Clean/Hexagonal Architecture**.

> Architecture plan: `docs/NEW_ARCHITECHTURE.md` · Product strategy: `PRODUCT.md` ·
> Design system: `DESIGN.md` + `src/styles/tokens.css`

## Stack

React 19 · Vite 8 · TypeScript 6 (strict) · TanStack Router (code-based) · Tailwind v4
(semantic OKLCH tokens) · Zustand · vite-plugin-pwa (Workbox) · i18next · Vitest + RTL ·
ESLint flat config with **FSD boundary enforcement**.

## Commands

```bash
npm run dev         # Vite dev server
npm run build       # tsc --noEmit && vite build (PWA output)
npm run preview     # serve the production build
npm run typecheck   # tsc --noEmit
npm run test        # vitest run
npm run lint        # eslint (incl. FSD layer boundaries)
npm run format      # prettier --write .
```

## Architecture

**FSD layers**, highest → lowest. A module may import only from layers **at or below**
its own — enforced by `eslint-plugin-boundaries` (`boundaries/dependencies`):

```
app  →  pages  →  widgets  →  features  →  entities  →  shared
```

- **shared** — framework-agnostic core: pure libs (`cn`, `EventBus`), repository **ports**
  (`Repository<T>`) + the in-memory **adapter**, config, i18n, the UI kit, design tokens.
- **entities** — business entities. Each owns `model/` (types + factories + Zustand store
  slice + context) and `api/` (its repository port).
- **features** — use-cases = **commands** (one write-path each; the UI and, later, the AI
  Tutor reuse them).
- **pages / widgets** — route screens and composite blocks.
- **app** — the **composition root**: the one place concrete adapters are chosen and
  **injected** into ports (Dependency Inversion), plus providers, router, global styles.

**Persistence** is behind ports: persisted entities run on **RxDB** (IndexedDB via Dexie)
today, with **Supabase sync** (Phase 9) layered in behind the same ports — **no change to
entity/feature code**. The ephemeral session uses the in-memory adapter.

## Status

Well past the walking skeleton. An installable PWA boots as a guest with full local-first
CRUD for palaces, rooms, loci, and questions; spaced-repetition review, quizzes, and
matching; streaks/XP and achievements; notifications; and a complete settings/profile area.
Every persisted entity lives in RxDB (IndexedDB via Dexie) behind injected ports, and the
whole UI is styled via semantic tokens. Remaining: Supabase sync (Phase 9) and the AI Tutor
(final phase), per the architecture plan.
