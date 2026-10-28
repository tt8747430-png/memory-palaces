# ADR 0009 — Extensions: a layer core can't see, switched off without loss; the Bible's text is a shared corpus

- **Status:** accepted · **Date:** 2026-09 · consolidated 2026-10

The mechanism is `app/extensions/` (registry, runtime, `ExtensionsProvider`, `ExtensionGate`, `FeatureGate`,
`load-extensions.ts`) and the contribution types in `shared/lib`. The one extension is `src/extensions/bible/`. The
corpus rules live in `supabase/migrations/20260921125345_bible_corpus_is_shared.sql`.

## Context

The owner wanted features a learner switches on and off in Settings, the first being Bible, with two conditions:
switching one off must break nothing, and must cost no progress. The cards a Bible import makes are ordinary cards
that study, sync and count toward streaks like any other.

## Decision

- **Core can't name an extension.** `src/extensions/<id>/` is its own layer. It reaches down like a page (widgets,
  features, entities, shared); only `app` may import it; extensions never import each other. `eslint-plugin-boundaries`
  enforces it. `app/extensions/registry.ts` is the one core file that names one.
- **Contributions are inverted.** A host reads them through `useExtensionPoint(point)` and never imports an
  extension: import-sheet rows, routes, Library orders (`deckSorts`) and filters (`deckFilters`), RxDB collections, an
  i18n namespace. A contribution carries i18n keys, never copy.
- **Loaded behind the splash, screens lazy.** For every registered extension, on or off, `createServices` awaits its
  collections, its messages and its runtime module. Only screens stay lazy, one chunk per route. A chunk that won't
  load fails boot onto the error screen.
- **`activate` is its composition root.** `extension-runtime.ts` follows `preferences.extensions` outside React. On,
  `activate(context)` starts the extension's stores and keepers and returns its services and a `deactivate`. Off,
  `deactivate` stops everything `activate` started; that is all "off" means for the backend.
- **Off deletes nothing.** Enablement is `preferences.extensions`, changed only through `setExtensionEnabled`, which
  edits the list rather than replacing it, so an older build can't switch off an id it never heard of. Collections are
  registered always, enabled or not, so no row is orphaned. A collection's table replicates only while its extension
  is on and resumes from its checkpoint when it comes back. Turning an extension on syncs, so it turns on everywhere.
- **Routes are always in the tree, and guarded.** A route of a switched-off extension sends the learner to Settings →
  Extensions with that row highlighted, never a 404 or a silent redirect home. The guard waits for the runtime to
  settle on loaded preferences. `ExtensionGate` answers while the learner stays, so switching off from another tab
  swaps the screen out instead of letting it throw.
- **An extension may declare features.** `manifest.features`; a contribution or route may name one. A switched-off
  feature withdraws its contributions, and its routes send the learner to the extension's overview (`FeatureGate`
  while they stay). `preferences.disabledFeatures` stores the ids switched **off**, through `setExtensionFeature`, so
  a feature a newer build adds arrives on and an unknown id round-trips. The runtime ignores features; a feature is
  honoured where its work is done.
- **A front door.** `overview: { route }` is an ordinary screen reached from Settings → Extensions. It says what the
  extension is, holds the feature switches, and can switch the extension off.

**The Bible.**

- Features: **Passage import** (`/import/bible` and its import-sheet row), **Verse library** (prefilling a picked
  passage from stored text), **Chapter decks** (cards placed in a book deck holding a chapter subdeck, created only
  if missing; an archived deck of the name doesn't count).
- **A card's back carries only the verse text**; the reference is on the front. A back that repeats it hands Match the
  answer.
- **Books are codes, names belong to the translation.** A verse is `{ translation, book: BookCode, chapter, verse,
text }` with id `translation:BOOK:chapter:verse`, so republishing updates in place. The one translation is
  Cornilescu 2024 (`cornilescu-2024`), Romanian, while the UI stays English. Rows stored under the old `web` id and a
  book name read correctly through `completeBibleVerse`, and `keep-verses-canonical.ts` (started by `activate`)
  re-keys them.
- **The corpus is published text, shared by every account.** `bible_verses` is keyed by `id` alone; every signed-in
  account reads it; only an account in `private.corpus_publishers` may write it (`publishes_corpus()`), and a
  non-publisher's push is answered with nothing refused, so its pending log clears. The corpus has no tombstones:
  `push_documents` writes `deleted = false` for it, so one device forgetting a book can't blank it for everyone. A
  purged publisher does not take the corpus with it. The publisher list is changed with the service key, never by
  the app.
- **Publishing is a developer tool.** The import makes cards only. Adding text from cards or from one deck, and
  forgetting a book, are on the Bible developer tools screen, shown only in dev mode.
- The verse table is held ([ADR 0005](0005-sync.md)). It raises no Realtime event; the corpus arrives with the next
  Sync.

## Consequences

- A new contribution point is added when a feature needs it, not ahead.
- `ImportSource` gained the neutral member `'extension'`, never `'bible'`.
- `synced-tables.test.ts` checks `push_documents`' allow-list against the composed table list, so an extension's
  missing SQL grant fails the suite.
- After `npm run build`, `npm run check:entry-graph` must stay green: a manifest holds only lazy loaders.

## History

- An admin Bible library gated on dev mode, books disabled where no text was held, "Keep this text", and "Clean
  references from backs" (2026-09). Replaced by the overview, every book pickable, and the developer tools.
- Verse text keyed by English book names under translation `web` (replaced 2026-09 by book codes and Cornilescu 2024).
- One settings link per extension (replaced 2026-09 by the overview and features).
- Bible verses per account, keyed `(user_id, id)` (replaced 2026-09 by the shared corpus).
- Saving missing verses from the import, on by default (replaced 2026-09: publishing is a developer tool).
