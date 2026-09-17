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

| Point            | Shape                                                 | Host                             |
| ---------------- | ----------------------------------------------------- | -------------------------------- |
| `import.options` | `{ id, icon, tone, title, subtitle, to }`             | the page rendering `ImportSheet` |
| routes           | `{ path, component }`                                 | `app/router.tsx`                 |
| collections      | `{ key, table, schema, migrations, conflictHandler }` | `app/persistence/database.ts`    |
| i18n             | a lazy namespace bundle                               | the extensions provider          |

`shared/ui/ImportSheet` stays prop-driven: it gains an optional `extraOptions` prop appended after
its two built-in rows. The _page_ calls `useExtensionPoint('import.options')` and passes them
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
- starts its stores
- starts any keepers it registers
- publishes its contributions into the extension-points context

On disable it does the exact inverse — `store.getState().stop()`, keeper teardown, contributions
withdrawn. "Backend off" means off, including background work; the symmetry is what stops a future
tracker from running after its extension is switched off.

Routes are **always** in the router tree, and always guarded. Opening `/import/bible` with Bible
off lands on Settings → Extensions with that row highlighted — never a blank 404, never a silent
redirect home. The tree is therefore static: toggling an extension never rebuilds the router.

### 3.4 Enablement state

`Preferences` gains `extensions: string[]` — the ids that are on.

- `preferencesSchema` goes to **version 3**; the migration adds `extensions: []`.
- `makePreferences` / `completePreferences` default and pass through the field, including ids the
  running build does not recognise. This is the read-side twin required for replicated rows.
- `setPreferences` **merges** the extension list; it never replaces it wholesale. An older build
  writing preferences must not switch off an extension it has never heard of.
- `entities/preferences` exports `type ExtensionId` and `isExtensionEnabled(prefs, id)`. No call
  site does array membership by hand.

### 3.5 Persistence and sync composition

Extension collections are registered in `createAppDatabase` **always**, enabled or not. A schema
the database does not know is a schema replication can orphan rows against; the collections are
cheap and the data must survive disabling.

Replication is different: a table joins the sync set only while its extension is enabled. Disable
stops it; re-enable resumes from its checkpoint, losing nothing. Because the toggle itself syncs,
enabling Bible on one device enables and syncs it everywhere.

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
`SettingsPage.tsx`), error, empty ("No extensions yet"), and offline (toggling is a local write and
works offline; the page says nothing misleading about the network).

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
`expandRange`, `refKey`. Pure, colocated tests. `formatRef` renders `Genesis 1:1` for a single
verse and `Genesis 1:1-31` for a range.

### 4.3 Verse text behind a port

`model/verse-text.ts` declares the port:

```ts
export interface VerseTextSource {
  read(ref: VerseRef): Promise<Verse[]> // Verse = { chapter, verse, text }
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

1. **The parser changes behaviour when it moves.** `parseVerseChapters` currently builds
   `back: ref + body`; in the extension it builds `back: body`. Its tests move with it and are
   rewritten to assert the reference is absent from the back.
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

One route, `/import/bible`, optionally carrying `?deckId=`. It is reached from the Bible row the
extension contributes to `ImportSheet`, from both the library and a deck.

A single scrolling screen with progressive disclosure, matching the reference mockups:

1. **Pick a Bible book** — searchable list of all 66.
2. **Pick a chapter** — number grid.
3. **Pick a starting verse** — number grid.
4. **Pick an ending verse** — `Just verse N` first, then the numbers above the start.

A breadcrumb shows the reference as it is built (`Genesis`, `Genesis 1:`, `Genesis 1:1`,
`Genesis 1:1-31`) with **Start over** and, once complete, **Change verses**.

**Verse text panel.** Prefilled from the source when one covers the range, with a quiet confirmation
that the text was imported. Otherwise it opens empty with a line explaining that this passage is not
in the library yet and can be pasted in. Editable in both cases.

**Paste text instead.** An entry at the top of the screen skips the picker entirely: paste raw
scripture, and `(1:1)`-style markers are parsed exactly as Paste Notes used to. This is the
stopgap route until the translation is bundled, and it is also where the admin publishes new text
into the library.

**Translation.** One translation, shown as a static label. No selector until there is a second.

**Target — "Include in decks".** A segmented choice:

- _Existing_ opens `MoveSheet targets="deck"` from `widgets/deck-tree` — the same drawer as moving
  a deck, subdecks and all.
- _New_ opens `PromptSheet` prefilled with the chapter (`Genesis 1`), an ordinary deck creation.

**Duplicates.** References already present in the target raise a banner naming the overlap
("You already have Genesis 1:1-10 here"). They are skipped by default; a toggle adds them anyway.

**Handing off.** Add writes the parsed cards into the existing import draft and navigates to the
existing review screen at `/decks/$deckId/import`. Editing, removing and applying come free; there
is no second review UI. `ImportSource` widens by one neutral member, `'extension'` — never
`'bible'`, which would put the word in core.

For a new deck the flow mirrors `NewPasteScreen`: create the deck, then land on its review screen.

### 4.6 Commands

- `features/add-verse-cards.ts` — reference plus text plus target → `ParsedCard[]` → import draft.
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

Moved out of `src/shared/lib/content-transfer.ts` into `src/extensions/bible/model/parse-verses.ts`,
with their tests: `parseVerses`, `parseVerseChapters`, `verseChapterTitles`, `detectPasteFormat`,
and the `PasteFormat` type. `src/shared/lib/index.ts` stops exporting them.

`NewPasteScreen` keeps `nextDefaultName`; only the bible-derived name goes. The three bible naming
tests in `PasteNotesPage.test.tsx` move to the extension and are rewritten against the new flow.

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

New `supabase/migrations/<timestamp>_bible_verses.sql`, following the existing phase-9 pattern:
table, RLS by owner, realtime publication, and the `push_documents` allow-list entry that
`synced-tables.test.ts` asserts against.

## 7. States and behaviour

Every new surface handles loading, error, empty and offline, per `docs/CODE_STYLE.md`. Specifically:

- the picker works fully offline; it reads bundled structure and local records
- an empty text panel is an ordinary state with an explanation, never an error
- the Extensions page reflects preferences readiness before rendering toggles
- motion honours `prefers-reduced-motion`; the screen respects safe areas and the keyboard rules in
  CODE_STYLE §11, since the paste box and deck-name prompt both summon the keyboard

## 8. Testing

Unit, colocated:

- canon counts, reference formatting/parsing, range expansion
- verse parsing after the move, asserting the back holds no reference
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
4. Paste Notes decoupling and the parser move.
5. The admin Bible library, including the opt-in back-cleaning.

## 10. Out of scope

The Bible tracker, the memorization overview and its profile badges, the Bible reading tab in the
bottom nav, the extensions gallery, a second translation, and the bundled translation itself. Each
lands behind the same manifest, adding the contribution point it needs.

## 11. Glossary additions

To `docs/UBIQUITOUS_LANGUAGE.md`:

- **Extension** — a self-contained feature the learner switches on in Settings. Never "plugin",
  never "add-on". "Extensions Gallery" is a future browse surface, not the mechanism.
- **Contribution point** — the named slot a host surface renders on an extension's behalf. Never
  "hook", which in this codebase means React.
- **Verse** — one numbered line of scripture. Its reference (`Genesis 1:1`) is not part of its
  text.
