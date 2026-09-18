# Extensions, and the Bible extension's first feature

**Date:** 2026-09-17
**Status:** approved design, not yet built
**Scope:** the extension mechanism, plus the Bible extension's _add cards_ feature. The Bible
tracker, the memorization overview and the Bible reading tab are named here only so the mechanism
is shaped to carry them; none of them is built by this spec.

## 1. What this is for

Mindscape gains **extensions**: self-contained features the learner switches on and off in
Settings. The first is **Bible**. Two properties decide every choice below.

1. **Core code must not know an extension exists.** `grep -ri bible src/{app,pages,widgets,features,entities,shared}`
   returns nothing but the registry's manifest list. Enforced by `eslint-plugin-boundaries`, not by
   discipline.
2. **Switching an extension off never costs progress.** Cards it made keep studying, syncing and
   counting toward streaks. Its own records stay stored. Re-enabling restores the exact state.

## 2. Decisions taken

| Question                     | Decision                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where verse text comes from  | A bundled translation eventually; until then, decks the user explicitly publishes into the Bible library. Never derived automatically. Both sit behind one port. |
| How an extension is packaged | Its own top-level layer with a manifest, contributions inverted through context.                                                                                 |
| What "off" does to its decks | Nothing. They are ordinary decks the moment they exist.                                                                                                          |
| What the picker shows        | The whole Bible, from a bundled structural skeleton. Ranges without text open an empty, editable box.                                                            |
| Where the on/off state lives | `preferences.extensions`, synced.                                                                                                                                |
| Bible source data            | Synced, like every other collection. A partial Bible is fine.                                                                                                    |
| Card shape                   | Front carries the reference, back carries **only** the verse text.                                                                                               |

## 3. The extension mechanism

### 3.1 The layer

New top-level layer `src/extensions/<id>/`. Each extension is a self-contained mini-app holding
its own `model/`, `ui/`, `features/`, `api/` and a `manifest.ts`.

`eslint.config.js` gains an element type and explicit rules:

- `{ type: 'extensions', pattern: 'src/extensions/*' }`
- an extension may import `widgets`, `features`, `entities`, `shared` — the same reach a page has
- **only** `app` may import `extensions/*`
- extension → extension is disallowed; extensions never depend on one another

Everything else keeps the existing FSD ordering. The point of the rules is that the boundary is a
lint error, not a convention.

### 3.2 Contributions are inverted, never imported

A host surface cannot import an extension, so extensions publish _contributions_ and hosts read
them from context.

`src/shared/lib/extension-points-context.tsx` — same shape as the existing
`auth-gateway-context.tsx` / `storage-context.tsx` — declares the contribution types, the context,
and `useExtensionPoint(point)`. It contains no extension-specific vocabulary.

Only the points this spec needs exist:

| Point           | Shape                                               | Host                             |
| --------------- | --------------------------------------------------- | -------------------------------- |
| `importOptions` | `{ id, icon, tone, titleKey, subtitleKey, to }`     | the page rendering `ImportSheet` |
| routes          | `{ path, load, name, validateSearch? }`             | `app/router.tsx`                 |
| collections     | `{ key, table, creator }`, behind `loadCollections` | `app/persistence/database.ts`    |
| i18n            | a lazy namespace bundle                             | the extensions provider          |

A contributed row carries **keys, not copy** — `titleKey` and `subtitleKey` inside the extension's
own namespace — so no English ever lives in a manifest. The provider adds the namespace before it
publishes the contributions, so a host never renders a raw key.

`shared/ui/ImportSheet` stays prop-driven: it gains an optional `extraOptions` prop appended after
its two built-in rows. The _page_ calls `useExtensionPoint('importOptions')` and passes them
down. No context reaches into a `shared/ui` primitive.

Nav tabs, settings rows and profile badge rows are **not** built now. They arrive with the
features that need them.

### 3.3 Registry and lifecycle

`src/app/extensions/registry.ts` holds the static list of known manifests. A manifest is tiny —
ids, labels, icon, and lazy loaders for routes, i18n and collections — so nothing an extension
renders reaches the entry graph. `npm run check:entry-graph` must stay green after `npm run build`.

`src/app/extensions/ExtensionsProvider.tsx` reads enabled ids from preferences and, for each
enabled extension:

- adds its i18n namespace via `i18n.addResourceBundle`
- mounts the extension's own provider, which is where its stores and its keepers start
- publishes its contributions into the extension-points context, once the namespace is in

On disable it does the exact inverse, and the inverse is **unmounting**. The extension's provider is
the single place its stores and keepers start, so React's own teardown stops them; the namespace goes
with `i18n.removeResourceBundle`; the contributions leave the context in the same render. "Backend
off" means off, including background work; the symmetry is what stops a future tracker from running
after its extension is switched off. There is deliberately **no keeper slot on the manifest** — a
keeper is an effect inside the extension's provider, and unmounting is its teardown.

Routes are **always** in the router tree, and always guarded. Opening `/import/bible` with Bible
off lands on Settings → Extensions with that row highlighted — never a blank 404, never a silent
redirect home. The guard therefore **waits for preferences to be ready** before it decides, the way
`rootRoute.beforeLoad` already waits on the session: reading a store that has not loaded would send
a cold deep link to Settings with the extension switched **on**, which is exactly the silent
redirect this rules out. The redirect carries `?highlight=<id>`, and the page highlights that row.
The tree is static: toggling an extension never rebuilds the router.

### 3.4 Enablement state

`Preferences` gains `extensions: string[]` — the ids that are on.

- `preferencesSchema` goes to **version 3**; the migration adds `extensions: []`.
- `makePreferences` / `completePreferences` default and pass through the field, including ids the
  running build does not recognise. This is the read-side twin required for replicated rows.
- `setPreferences` **merges** the extension list; it never replaces it wholesale. The list is not
  an ordinary member of `PreferencesChanges`: it is changed by handing `setPreferences` a function
  over the stored ids, so no caller can hold a whole array and overwrite ids it never read. An
  older build writing preferences must not switch off an extension it has never heard of.
- `type ExtensionId` is declared in `shared/lib` beside the manifest and re-exported from
  `entities/preferences`, the way `ContentSort` and `SwipePreferences` already are. It stays a
  string alias on purpose: the set of ids is open, and an id this build never heard of has to
  round-trip.
- `entities/preferences` exports `isExtensionEnabled(prefs, id)`. No call site does array membership
  by hand, and no feature re-exports it a second time.

### 3.5 Persistence and sync composition

Extension collections are registered in `createAppDatabase` **always**, enabled or not. A schema
the database does not know is a schema replication can orphan rows against; the collections are
cheap and the data must survive disabling. The manifest hands them over behind `loadCollections()`,
awaited in `createServices` before the database is built, so a schema never reaches the entry graph.

The generic conflict handlers move with them: `lastWriteWins` and `firstWriteWins` are pure and
generic over `Clocked`, but they sit in `app/persistence/conflict-handlers.ts`, which an extension
may not import. They move to `shared/api/rxdb`; `mergeCardConflict` and `mergeProgressConflict` stay
in `app`, since they know entities.

Replication is different: a table joins the sync set only while its extension is enabled. Disable
stops it; re-enable resumes from its checkpoint, losing nothing. Both halves must honour that:
`SyncManager.cycle` filters its targets through the predicate, **and** `SyncManager.fromSupabase`
stops handing `createCloudWatcher` the hardcoded `SYNCED_TABLES` const and passes the active tables
instead — otherwise Realtime stays deaf to an enabled extension's table. Because the watcher is built
once per `start()`, `SyncProvider` restarts the manager when the enabled set changes — and restart
means `stop()` then `start()`, because `start()` returns early when the account has not changed.
Because the toggle itself syncs, enabling Bible on one device enables and syncs it everywhere.

`SYNCED_TABLES` is currently a compile-time const in `shared/config/sync-tables.ts` feeding
`SyncedTable`, the composition root's `syncTargets`, `features/sync/divergence.ts` and the cloud
watcher. Hardcoding an extension's table there would be exactly the leak this design exists to
prevent, so:

- `SYNCED_TABLES` keeps exactly the core tables. The list replication actually uses is composed
  in `app/composition-root.ts` from those plus the enabled extensions' tables.
- A sync target is described as `{ table, collectionKey }` rather than assuming the RxDB
  collection key equals the table name, so an extension may use `bibleVerses` for the collection
  and `bible_verses` for the table.
- `features/sync/divergence.ts` takes its table list from its deps instead of importing the const.
- `synced-tables.test.ts` compares the `push_documents` allow-list against the **composed** list,
  so a missing SQL grant still fails the suite.

### 3.6 The Extensions settings page

New core page `src/pages/settings-extensions/`, route `/settings/extensions`, reached from a row
in Settings. It lists every registered extension — name, one-line description, icon, toggle — and
handles all four states: loading (gated on `selectIsReady` for preferences, like
`SettingsPage.tsx`), empty ("No extensions yet"), offline (toggling is a local write and works
offline, so the page says nothing misleading about the network) and error — which here is a **failed
write**, surfaced with `toast.error` the way every other local write in the app surfaces one. There
is no error _screen_, because `StoreStatus` has no `error` member: the stores are
`idle | loading | ready`, and inventing a fourth state for one page would misdescribe every other.

Each row can lead to an extension detail page contributed by the extension. Bible's holds the
admin Bible library (§4.7).

## 4. The Bible extension

`src/extensions/bible/`.

### 4.1 The canon skeleton

`model/canon.ts` — 66 books: name, chapter count, and verses per chapter. A few KB, in its own
lazily-imported chunk, no copyrighted text, so the picker can always offer every book, chapter and
a correct verse count. Unit-tested against known counts (Genesis has 50 chapters; Genesis 1 has 31
verses; Psalm 117 has 2; the canon has 1189 chapters).

### 4.2 References

`model/reference.ts` — `VerseRef { book, chapter, from, to }` plus `formatRef`, `parseRef`,
`formatPartial`. Pure, colocated tests. `refKey` lives in `model/verse.ts`, which knows about
translations; `reference.ts` does not. `formatRef` renders `Genesis 1:1` for a single
verse and `Genesis 1:1-31` for a range.

### 4.3 Verse text behind a port

`model/verse-text.ts` declares the port:

```ts
export interface VerseTextSource {
  read(ref: VerseRef): Promise<Verse[]> // Verse = { verse, text } — the ref already fixes the chapter
}
```

Today one adapter reads published sources out of the `bibleVerses` collection. The bundled
translation later implements the same port and nothing above it changes. A range with no text
resolves to an empty list — not an error. That is a normal, expected state until the Bible is
complete.

### 4.4 Card shape — the reference lives on the front only

```
front: Genesis 1:1
back:  In the beginning God created the heavens and the earth.
```

The back carries verse text and nothing else. A back that repeats the reference hands Match the
answer and makes the game pointless. Three consequences:

1. **The parser changes behaviour, and changes hands.** `parseVerseChapters` in
   `shared/lib/content-transfer.ts` builds `back: ref + body`; the extension's `build-verse-cards.ts`
   builds `back: body`. The cases worth keeping become cases in the extension's suite, asserting the
   reference is absent from the back — see §5 for why this is a deletion rather than a move.
2. **Deriving from a deck strips the reference.** Publishing a deck as a source removes a leading
   reference from each back (`^<book> <chapter>:<verse>\s*`, tolerant of punctuation and of the
   book name being absent) before storing, so sources are clean even though the existing cards are
   not. The same strip runs on text kept from the paste box.
3. **Cards already on the device are repaired only on request.** They are content the learner owns
   and they sync, so no schema migration rewrites them. The admin Bible library offers **Clean
   references from backs**: choose a deck, see how many cards would change, confirm, and the
   rewrite goes through the normal card command so it syncs and logs pending changes like any
   other edit.

### 4.5 The add-cards flow

One route, `/import/bible`, optionally carrying `?deckId=`, validated by the manifest's own
`validateSearch`. It is reached from the Bible row the extension contributes to `ImportSheet`, from
both the library and a deck. Arriving **with** a deck id, the reader has already said where the
cards go: the flow opens with "Include in decks" off and that deck as the destination. Arriving
without one, the toggle opens on.

A single scrolling screen with progressive disclosure, matching the reference mockups:

1. **Pick a Bible book** — searchable list of all 66.
2. **Pick a chapter** — number grid.
3. **Pick a starting verse** — number grid.
4. **Pick an ending verse** — `Just verse N` first, then the numbers **above** the start. The grid
   begins at `N+1`; the lead pill is the only way to pick the single-verse case, so no number is
   offered twice.

A breadcrumb shows the reference as it is built (`Genesis`, `Genesis 1:`, `Genesis 1:1`,
`Genesis 1:1-31`) with **Start over** and, once complete, **Change verses**.

**Verse text panel.** On screen from the start and never hidden, as the mockups show — the picker
appears above it, not instead of it. Prefilled once a range is complete and the library covers it,
with a quiet confirmation that the text was imported; otherwise it stays empty with a line explaining
that this passage is not in the library yet and can be pasted in. Editable throughout.

Because the box is always there, **pasting is not a separate mode**: paste raw scripture without
touching the picker and the `(1:1)` and `n)` markers are parsed exactly as Paste Notes used to. That
is the stopgap until the translation is bundled, and the text the admin publishes into the library.

**The prefill emits markers.** When the library covers the range, the box is filled as
`1) …  2) …` — the shape the mockup shows and the shape the parser reads back. A plain join would
round-trip into a single card covering the whole range, which is the one outcome this design must
not produce.

**Split into individual verses.** An explicit toggle, default on, reading "Split into N individual
verses". On, each verse becomes its own card. Off, the range becomes one card fronted
`Genesis 1:1-31`. Leaving it implicit would silently collapse unmarked text into one card, against
"each card is a verse".

**Translation.** One translation, shown as a static label. No selector until there is a second.

**Target — "Include in decks".** A toggle, default on. It chooses between the app placing the cards
and the reader placing them.

_On_ — **automatic**. The cards go to a deck named after the book holding a subdeck named after the
chapter, both created only if they are missing and otherwise reused: `Genesis` → `Genesis 1` →
thirty-one verse cards. Adding `1:1-10` and later `1:11-31` lands both in the same subdeck rather
than making a second one. A book deck already filed inside a folder counts as existing and is reused
where it sits; an archived deck of the same name does not count, because the archive is a place
outside every folder and deck (ADR 0003). This mirrors the shape the library already has — deck =
book, subdeck = chapter, card = verse — which is what lets the reading tracker and the memorization
overview be computed later without extra bookkeeping.

_Off_ — **manual**. The reader places the cards: `MoveSheet targets="deck"` from `widgets/deck-tree`
picks an existing deck or subdeck, or `PromptSheet` creates a new deck by name, an ordinary deck
creation. Nothing is created without being asked for.

**Duplicates.** Checked across the **whole library**, not just the target deck — the mockup says
"already in your account", and with decks shaped book → chapter → verse the same passage can already
live elsewhere. References already held raise a banner naming the overlap and a **Show me** action
that opens the deck holding the first one. They are skipped by default; a toggle adds them anyway.

**Handing off.** Add writes the parsed cards into the existing import draft and navigates to the
existing review screen at `/decks/$deckId/import`. Editing, removing and applying come free; there
is no second review UI. `ImportSource` widens by one neutral member, `'extension'` — never
`'bible'`, which would put the word in core.

For a new deck the flow mirrors `NewPasteScreen`: create the deck, then land on its review screen.

**One deliberate divergence from the mockups**, recorded so nobody "restores" it: their
`Include in Collections` can target **several** collections at once via checkboxes. A card here goes
to exactly one deck, so both branches of the toggle resolve to a single destination.

### 4.6 Commands

- `features/build-verse-cards.ts` — reference plus text plus the split toggle → `ParsedCard[]`.
  Pure; no store, no draft.
- `features/place-in-chapter-deck.ts` — `ensureChapterDeck`: the automatic placement above, book
  deck then chapter subdeck, reused where they already sit.
- `features/add-verse-cards.ts` — the command the screen calls: build, drop the duplicates, resolve
  the destination, write the import draft. The screen does not do this inline — a write is a
  command, and the screen only says when.
- `features/publish-source.ts` — a deck, or the text in the paste box, → verse records, references
  stripped.
- `features/clean-reference-backs.ts` — the opt-in repair of §4.4.3, routed through the core card
  command.

### 4.7 Admin

Gated on `useDevMode()`, the device-local flag that already ships in every build. Settings →
Extensions → Bible → **Bible library**:

- publish from a deck (pick it with `MoveSheet`; its subdecks and cards parse into verses)
- keep the text currently in the import screen's paste box
- see what is published, per book, and remove it
- clean references from a deck's backs

Nothing here is reachable without dev mode, and nothing here is required for the ordinary flow.

## 5. Decoupling Paste Notes

Paste Notes becomes notes-only. Removed from `src/pages/paste-notes/`: `FormatToggle.tsx`,
`BibleHint`, the `format === 'bible'` branch of `use-paste-parsing.ts`, `suggestedName` and the
chapter-title deck naming it feeds, and the bible copy in `shared/i18n/locales/en/`.

**Deleted from `src/shared/lib/content-transfer.ts`, not moved:** `parseVerses`,
`verseChapterTitles`, the module-private `parseVerseChapters` they are built on, `detectPasteFormat`
and the `PasteFormat` type. `parseVerses` and `verseChapterTitles` leave
`src/shared/lib/index.ts`; `parseVerseChapters` is not exported today, so nothing "stops exporting"
it.

Deletion rather than a move, because the extension already has the parser. `build-verse-cards.ts`
reads the same `(1:1)` and `n)` markers, strips references, and — given no reference — keys the
fronts off the markers, which is the whole of what `parseVerses` did. Carrying the old one across as
well would leave two parsers for one format, the second with no caller: the dead shim the change
rules forbid. The behaviour worth keeping crosses over as test cases instead, in
`build-verse-cards.test.ts`.

`detectPasteFormat` goes for the same reason and one more: Paste Notes is notes-only and has nothing
left to detect, and the extension's box decides by markers (`canSplit`), not by format.

`NewPasteScreen` keeps `nextDefaultName`; only the bible-derived name goes. Of the three bible
naming tests in `PasteNotesPage.test.tsx`, one is rewritten in place to assert the default name and
the other two go: the bible path they covered is covered by the extension's own tests.

## 6. Data and sync

**Collection** `bibleVerses`, **table** `bible_verses`.

```ts
interface BibleVerse extends Entity {
  translation: string // one value for now
  book: string // canonical book name
  chapter: number
  verse: number
  text: string // verse text only, never the reference
}
```

`id` is `${translation}:${book}:${chapter}:${verse}` (`maxLength: 100` on the primary key, as every
other schema declares), so republishing the same verse updates in place instead of duplicating. Conflict handler: `lastWriteWins`. Schema version 0 — new collection,
no migration.

New `supabase/migrations/<timestamp>_bible_verses.sql`, taking the shape every mirror table already
has — `20260915130000_history_table.sql` is the one to copy:

- **`primary key (user_id, id)`**. `id` alone would collide across accounts: `web:Genesis:1:1` is
  the same string for every learner who ever publishes that verse.
- `user_id uuid not null default auth.uid() references auth.users on delete cascade`, and the
  `(user_id, updated_at, id)` index.
- a `set_updated_at` trigger, because `updated_at` is the **server** clock the pull checkpoint reads.
- `grant`/`revoke` plus the four per-operation RLS policies — `own_select`, `own_insert`,
  `own_update`, `own_delete` — not one `for all`.
- an idempotent `do $$` block for the realtime publication, since `alter publication … add table`
  throws on a second run.
- the whole `push_documents` function re-declared with `bible_verses` in its allow-list.
  `synced-tables.test.ts` reads the newest definition in the directory, so a fragment will not do.

## 7. States and behaviour

Every new surface handles loading, error, empty and offline, per `docs/CODE_STYLE.md`. Specifically:

- the picker works fully offline; it reads bundled structure and local records
- an empty text panel is an ordinary state with an explanation, never an error
- the Extensions page reflects preferences readiness before rendering toggles
- motion honours `prefers-reduced-motion`; the screen respects safe areas and the keyboard rules in
  CODE_STYLE §11, since the paste box and deck-name prompt both summon the keyboard

## 8. Testing

Unit, colocated:

- canon counts, reference formatting/parsing
- verse parsing in the extension, asserting the back holds no reference, including the cases
  inherited from the core parser being deleted (a verse that wraps a line, a book header above the
  markers, ordinary notes yielding nothing)
- reference stripping, including backs that never had one
- duplicate detection against a deck's existing cards
- preferences: unknown extension ids survive a write-back; the v3 migration defaults to `[]`

Component:

- the picker's four steps, breadcrumb, Start over and Change verses
- the enable/disable contract: with Bible off the Import sheet shows two options and `/import/bible`
  lands on Settings → Extensions; with it on, three options and the flow opens
- the Extensions settings page in all four states

Whole-app: `npm run typecheck && npm run lint && npm run test`, then `npm run build &&
npm run check:entry-graph`, since a new layer and a new manifest list touch the entry graph.

## 9. Build order

1. The mechanism alone — boundaries, contribution context, registry, provider, preferences v3,
   Extensions settings page. No bible anywhere. Ships useful and inert.
2. Canon, references, the verse-text port, the `bibleVerses` collection and its Supabase migration.
3. The add-cards flow, including the paste-instead route and the handoff to import review.
4. Paste Notes decoupling, and deleting the core verse parser the extension has replaced.
5. The admin Bible library, including the opt-in back-cleaning.

## 10. Out of scope

The Bible tracker, the memorization overview and its profile badges, the Bible reading tab in the
bottom nav, the extensions gallery, a second translation, and the bundled translation itself. Each
lands behind the same manifest, adding the contribution point it needs.

## 11. Glossary additions

To `docs/UBIQUITOUS_LANGUAGE.md`, plus a paragraph in `CLAUDE.md`'s Architecture section teaching
the new layer and its one import rule:

- **Extension** — a self-contained feature the learner switches on in Settings. Never "plugin",
  never "add-on". "Extensions Gallery" is a future browse surface, not the mechanism.
- **Contribution point** — the named slot a host surface renders on an extension's behalf. Never
  "hook", which in this codebase means React.
- **Verse** — one numbered line of scripture. Its reference (`Genesis 1:1`) is not part of its
  text.
