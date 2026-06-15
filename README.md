# Mindscape — Your Memory Palace

A phone-first, **offline-first PWA** for memory training with the method of loci.
Rewrite of the original app into **Feature-Sliced Design × Clean/Hexagonal Architecture**.

> Architecture plan: `../memory-palaces-app-ui/docs/ai_docs/NEW_ARCHITECHTURE.md` · Design system:
> `docs/DESIGN_SYSTEM.md` + `docs/tokens.css`

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

**Persistence** is behind ports: `InMemoryRepository` today → RxDB (Phase 3) → Supabase
sync (Phase 9), with **no change to entity/feature code**.

## Status

Phase 0 (design system) and Phase 1 (foundation / walking skeleton) complete: an
installable PWA shell boots as a guest, reads session state through an injected repository,
and is styled entirely via semantic tokens. Remaining phases per the architecture plan.
