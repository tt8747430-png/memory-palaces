# Mindscape

An offline-first PWA for spaced-repetition study. Learners keep Decks of Cards and Questions, study them as Flashcards,
a Quiz or Match, and earn XP, Streaks and Badges along the way. Data lives on the device (RxDB); with an account, Sync
copies it through Supabase.

## Run it

```sh
npm ci
cp .env.example .env.local   # VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Without the Supabase variables the app runs on the device only: sign-in is local, and nothing syncs.

```sh
npm run typecheck && npm run lint
npm run test                         # Vitest; Supabase suites skip without SUPABASE_TEST_URL/KEY
npm run build && npm run check:entry-graph
```

## Docs

- [CLAUDE.md](CLAUDE.md): architecture, rules, commands. Start here.
- [PRODUCT.md](PRODUCT.md): who it is for and how it should feel.
- [docs/adr/README.md](docs/adr/README.md): the decision records, one per area.
- [docs/CODE_STYLE.md](docs/CODE_STYLE.md): how code and UI are written.
- [docs/UBIQUITOUS_LANGUAGE.md](docs/UBIQUITOUS_LANGUAGE.md): the glossary.
- [docs/HISTORY.md](docs/HISTORY.md): what was built and what was fixed.
- [prompts/](prompts/README.md): prompts for agents.
