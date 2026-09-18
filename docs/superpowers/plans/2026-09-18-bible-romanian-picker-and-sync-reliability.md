# Bible in Romanian, a better picker, and a Sync that tells the truth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix published Bible text never prefilling, make references Romanian (Cornilescu 2024), rebuild the passage
picker and import page, give Bible a real settings page, and make Sync stop losing edits and stop claiming it is done
when it is not.

**Architecture:** Bible identity moves to stable book codes with names owned by the translation; a keeper re-keys stored
verses. Sync pushes carry the clock they were based on, the server refuses unseen overwrites atomically, and conflict
handlers merge field by field; every synced write lands in the pending log; Autosync reacts to cloud changes and retries;
every request has a timeout.

**Tech Stack:** React 19, TypeScript strict, RxDB 17 (Dexie), Supabase (PostgREST, Realtime, plpgsql), Zustand, TanStack
Router, i18next, Tailwind v4, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-18-bible-romanian-picker-and-sync-reliability-design.md`

## Global Constraints

- FSD layers lint-enforced (`app → pages → widgets → features → entities → shared`, extensions beside, only `app`
  imports an extension). Cross-slice via barrels only.
- Zero legacy in code: delete what is replaced (`book-offer.ts`, `publish-verses.ts`, `verse-text.ts`,
  `clean-reference-backs.ts`, `reference-backs.ts`, `refuseUnseenOverwrites`, `splitUnseenOverwrites`, `admin` on the
  manifest, `lastWriteWins` once unused). Persisted data gets migrations + read-side twins.
- Prettier: no semicolons, single quotes, trailing comma all, width 100. `npx prettier --write <touched files>` only.
- Strict TS (`noUncheckedIndexedAccess`, `verbatimModuleSyntax` → `import type`).
- Tests colocated, Vitest `globals: false` (import `describe/it/expect/vi` explicitly).
- Every UI surface: loading, empty, error, offline; semantic tokens only; ≥44px targets; reduced motion honored.
- UI copy English (i18n); Bible book names, references and deck names Romanian (translation data, not i18n).
- Translation id `cornilescu-2024`, name `Biblia Dumitru Cornilescu 2024`, short `Cornilescu 2024`, language `ro`.
- Commit per task; message ends with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Never stage
  `docs/2.Bugs.md` (the learner's WIP).
- Done = `npm run typecheck && npm run lint && npm run test && npm run build && npm run check:entry-graph`.

---

### Task 1: Remove "Clean references from backs"

**Files:**

- Delete: `src/extensions/bible/features/clean-reference-backs.ts`, `…/clean-reference-backs.test.ts`,
  `src/extensions/bible/model/reference-backs.ts`, `…/reference-backs.test.ts`
- Modify: `src/extensions/bible/ui/BibleLibraryPage.tsx` (drop the Clean button, the `clean` sheet subject, the
  `ConfirmDialog`, `editCard`/`useCardStoreApi` imports), `src/extensions/bible/ui/BibleLibraryPage.test.tsx` (drop the
  clean cases), `src/extensions/bible/i18n/en.ts` (drop `cleanBacks`, `cleanHint`, `cleanDeck`, `cleanBacksCount_*`,
  `cleanedBacks_*`, `cleanFailed`)

- [ ] Delete the four files; remove every use; `DECK_SHEETS` collapses to the publish sheet only (a plain
      `DestinationSheet` with the publish copy).
- [ ] `npx vitest run src/extensions/bible` → PASS; `npm run typecheck && npm run lint` → clean.
- [ ] Commit `refactor(bible): drop cleaning references from card backs`.

### Task 2: Canon by code, names by translation

**Files:**

- Rewrite: `src/extensions/bible/model/canon.ts`, `…/canon.test.ts`
- Rewrite: `src/extensions/bible/model/translations.ts`, `…/translations.test.ts`
- Create: `src/extensions/bible/model/book-names.ts`, `…/book-names.test.ts`

**Interfaces (produces):**

```ts
// canon.ts
export type Testament = 'old' | 'new'
export type Genre =
  | 'law'
  | 'history'
  | 'wisdom'
  | 'majorProphets'
  | 'minorProphets'
  | 'gospels'
  | 'acts'
  | 'pauline'
  | 'general'
  | 'apocalyptic'
export type BookCode = (typeof BOOK_CODES)[number] // 'GEN' … 'REV'
export interface BibleBook {
  code: BookCode
  english: string
  testament: Testament
  genre: Genre
  verses: readonly number[]
}
export const BOOKS: readonly BibleBook[]
export function findBook(code: BookCode): BibleBook
export function isBookCode(value: string): value is BookCode
export function chapterCount(code: BookCode): number
export function verseCount(code: BookCode, chapter: number): number

// translations.ts
export interface Translation {
  id: string
  name: string
  shortName: string
  language: string
  books: Readonly<Record<BookCode, { name: string; abbreviation: string }>>
}
export const CORNILESCU_2024: Translation // id 'cornilescu-2024'
export const DEFAULT_TRANSLATION: string // = CORNILESCU_2024.id
export function findTranslation(id: string): Translation | undefined
export function translationName(id: string): string // full name, or id upper-cased

// book-names.ts
export function bookName(code: BookCode): string // '1 Corinteni'
export function bookAbbreviation(code: BookCode): string // '1Cor'
export function normalizeBookText(text: string): string // NFD, strip marks, lowercase, drop spaces/dots
export function resolveBook(text: string): BookCode | undefined // exact alias match
export function matchBooks(prefix: string, limit?: number): BookCode[] // prefix match, exact first, canon order
```

Canon rows (code|english|genre|verse counts) keep today's counts. Romanian names/abbreviations (verbatim):

```
GEN Geneza Gen · EXO Exodul Exod · LEV Leviticul Lev · NUM Numeri Num · DEU Deuteronomul Deut
JOS Iosua Ios · JDG Judecători Jud · RUT Rut Rut · 1SA 1 Samuel 1Sam · 2SA 2 Samuel 2Sam
1KI 1 Împărați 1Împ · 2KI 2 Împărați 2Împ · 1CH 1 Cronici 1Cron · 2CH 2 Cronici 2Cron · EZR Ezra Ezra
NEH Neemia Neem · EST Estera Est · JOB Iov Iov · PSA Psalmii Ps · PRO Proverbele Prov
ECC Eclesiastul Ecl · SNG Cântarea cântărilor Cânt · ISA Isaia Is · JER Ieremia Ier
LAM Plângerile lui Ieremia Plâng · EZK Ezechiel Ezec · DAN Daniel Dan · HOS Osea Osea · JOL Ioel Ioel
AMO Amos Amos · OBA Obadia Obad · JON Iona Iona · MIC Mica Mica · NAM Naum Naum · HAB Habacuc Hab
ZEP Țefania Țef · HAG Hagai Hag · ZEC Zaharia Zah · MAL Maleahi Mal · MAT Matei Mat · MRK Marcu Marc
LUK Luca Luca · JHN Ioan Ioan · ACT Faptele apostolilor Fapt · ROM Romani Rom · 1CO 1 Corinteni 1Cor
2CO 2 Corinteni 2Cor · GAL Galateni Gal · EPH Efeseni Ef · PHP Filipeni Filip · COL Coloseni Col
1TH 1 Tesaloniceni 1Tes · 2TH 2 Tesaloniceni 2Tes · 1TI 1 Timotei 1Tim · 2TI 2 Timotei 2Tim · TIT Tit Tit
PHM Filimon Filim · HEB Evrei Evr · JAS Iacov Iac · 1PE 1 Petru 1Pet · 2PE 2 Petru 2Pet · 1JN 1 Ioan 1Ioan
2JN 2 Ioan 2Ioan · 3JN 3 Ioan 3Ioan · JUD Iuda Iuda · REV Apocalipsa Apoc
```

Genres: GEN–DEU law · JOS–EST history · JOB–SNG wisdom · ISA–DAN majorProphets · HOS–MAL minorProphets · MAT–JHN
gospels · ACT acts · ROM–PHM pauline · HEB–JUD general · REV apocalyptic.

- [ ] **Tests first** (`canon.test.ts`, `translations.test.ts`, `book-names.test.ts`):
  - 66 books, 39 old / 27 new, codes unique, `verseCount('PSA', 119) === 176`, `chapterCount('OBA') === 1`;
  - every code has a Romanian name and abbreviation; `translationName('cornilescu-2024')` is the full name; unknown id
    upper-cased;
  - `resolveBook` accepts `'1 Corinteni'`, `'1corinteni'`, `'1 Cor.'`, `'1Cor'`, `'1 Corinthians'`, `'1 Împărați'`,
    `'1 Imparati'`, `'ţefania'` (cedilla), `'Țefania'` (comma) → the right code; rejects `'Ioana'`, `''`, `'Corinteni'`;
  - `matchBooks('i', 66)` lists the prefix matches in canon order (`JOS, JOB, ISA, JER, JOL, JON, JHN, JAS, JUD`);
    `matchBooks('ioan')` puts the exact `JHN` first; `matchBooks('1c')` → `['1CH', '1CO']`.
- [ ] Run → FAIL. Implement. Run → PASS. Commit `feat(bible): the canon by code, named by its translation`.

### Task 3: References, verses and placement in Romanian

**Files:**

- Modify: `model/reference.ts` (+test), `model/verse.ts` (+test), `model/deck-names.ts`, `model/verse-sources.ts`
  (+test), `model/verse-cards.ts` (+test), `features/place-in-chapter-deck.ts` (+test), `features/add-verse-cards.ts`
  (+test), `api/verse-schema.ts` (handler only changes in Task 11), `testing/decks.ts`
- Create: `model/library-index.ts` (+test) — replaces `model/verse-text.ts`
- Delete: `model/verse-text.ts`, `model/verse-text.test.ts`

**Interfaces:**

```ts
// reference.ts
export interface VerseRef {
  book: BookCode
  chapter: number
  from: number
  to: number
}
export interface PartialVerseRef {
  book: BookCode | null
  chapter: number | null
  from: number | null
  to: number | null
}
export function formatRef(ref: VerseRef): string // '1 Corinteni 8:9', 'Ioan 3:16-18'
export function parseRef(text: string): VerseRef | null // book via resolveBook; validates against canon
export function formatPartial(parts: PartialVerseRef): string

// verse.ts
export function refKey(translation: string, book: BookCode, chapter: number, verse: number): string
export interface BibleVerse extends Entity {
  translation: string
  book: BookCode
  chapter: number
  verse: number
  text: string
}
export function makeBibleVerse(input: MakeBibleVerseInput): BibleVerse // book must be a BookCode
/** Read-side twin: 'web' → DEFAULT_TRANSLATION; a book name → its code. Id untouched (the keeper re-keys). */
export function completeBibleVerse(verse: BibleVerse): BibleVerse
export const LEGACY_TRANSLATION = 'web' // the placeholder id every row was published under before 2026-09-18

// library-index.ts
export interface LibraryIndex {
  hasBook(book: BookCode): boolean
  hasChapter(book: BookCode, chapter: number): boolean
  hasVerse(book: BookCode, chapter: number, verse: number): boolean
  text(book: BookCode, chapter: number, verse: number): string | null
  coverage(book: BookCode): { chapters: number; verses: number }
}
export function indexLibrary(verses: readonly BibleVerse[], translation?: string): LibraryIndex
```

- [ ] **Tests first:** `formatRef({book:'1CO',chapter:8,from:9,to:9}) === '1 Corinteni 8:9'`; `parseRef('Ioan 3:16-18')`,
      `parseRef('1 cor 13:4')`, `parseRef('Ioan 22:1')` → null (no chapter 22), `parseRef('Geneza 1:32')` → null;
      `completeBibleVerse({translation:'web', book:'1 Corinteni', …})` → `translation 'cornilescu-2024', book '1CO'`;
      unresolvable book left as is; `chapterDeckName('1CO', 8) === '1 Corinteni 8'`; placement finds the learner's
      existing `1 Corinteni` deck and `1 Corinteni 8` subdeck; `versesFromCards` reads Romanian fronts and yields codes;
      `buildVerseCards` fronts are Romanian; `indexLibrary` coverage counts distinct chapters and verses, ignores other
      translations.
- [ ] Implement; update every caller (`use-bible-import.ts` compiles against the index in Task 7 — in this task keep it
      compiling with a minimal `indexLibrary` swap for `createStoredVerseSource`).
- [ ] `npx vitest run src/extensions/bible` → PASS. Commit `feat(bible): references, verses and decks in Romanian`.

### Task 4: The keeper that re-keys stored verses

**Files:**

- Create: `src/extensions/bible/persistence/keep-verses-canonical.ts`, `…/keep-verses-canonical.test.ts`
- Modify: `src/extensions/bible/runtime.ts` (start it in `activate`, stop it in `deactivate`), `runtime` test if any

**Interface:**

```ts
/** Re-keys every verse whose id is not `refKey` of its completed self. Returns stop(). */
export function keepVersesCanonical(store: BibleVerseStore): () => void
```

Algorithm (runs on every store change, re-entrancy-guarded like `keep-history-capped.ts`):

```ts
const stale = verses.filter(
  (v) => isBookCode(v.book) && v.id !== refKey(v.translation, v.book, v.chapter, v.verse),
)
for (const old of stale) {
  const id = refKey(old.translation, old.book as BookCode, old.chapter, old.verse)
  const held = byId.get(id)
  if (!held || held.updatedAt < old.updatedAt) await save({ ...old, id })
  await remove(old.id)
}
```

(`verses` here are the store's completed rows, so `translation`/`book` are already canonical.)

- [ ] **Tests first** (in-memory repo via `shared/test/started`): legacy `web:1 Corinteni:8:9` becomes
      `cornilescu-2024:1CO:8:9` and the old id is gone; an existing newer canonical row is kept and the legacy one only
      removed; an unresolvable book is untouched; running twice writes nothing the second time; `stop()` unsubscribes.
- [ ] Implement + wire. Commit `feat(bible): a keeper moves stored verses onto their canonical ids`.

### Task 5: Picker model — jump, recents, range picking

**Files:**

- Create: `model/jump.ts` (+test), `model/recents.ts` (+test), `model/passage-text.ts` (+test)
- Rewrite: `model/use-passage-picker.ts` (+test)
- Delete: `model/book-offer.ts` (+test)

**Interfaces:**

```ts
// jump.ts
export interface Jump {
  books: BookCode[]
  target: PartialVerseRef | null
}
/** 'ioan 3 16-18', '1cor13', 'ps 23', 'Ioan 3:16'. `target` is as far as the text determines, validated. */
export function parseJump(text: string): Jump

// recents.ts
export interface RecentPassage {
  book: BookCode
  chapter: number
}
export function recentPassages(
  cards: readonly { front: string; createdAt: string }[],
  limit?: number,
): RecentPassage[] // newest first, unique by book+chapter, default 6

// passage-text.ts
export interface PassageText {
  text: string
  held: number
  missing: number[]
}
/** One verse per line: '16) text'; a verse the library lacks is its bare marker '17) '. */
export function passagePrefill(ref: VerseRef, index: LibraryIndex): PassageText

// use-passage-picker.ts
export type PickerStep = 'book' | 'passage' | 'done'
export interface PassagePicker extends PartialVerseRef {
  step: PickerStep
  ref: VerseRef | null // complete and confirmed
  chapterOptions: number[]
  verseOptions: number[]
  pickBook(book: BookCode): void // → passage, clears the rest
  pickChapter(chapter: number): void // clears the range
  tapVerse(verse: number): void // first tap: from; second: to (≥ from) or restart; third: restart
  justFrom(): void // to = from
  confirm(): void // requires from & to → done
  edit(): void // done → passage, keeps the range
  toBooks(): void // → book, clears everything
  jump(target: PartialVerseRef): void // complete → done; else the furthest step
}
```

- [ ] **Tests first:** `parseJump('ioan 3 16-18').target` = `{JHN,3,16,18}`; `'1cor13'` → `{1CO,13,null,null}`;
      `'ps 23'` → `{PSA,23,…}`; `'Ioan 3:16'` → `{JHN,3,16,16}`; `'i'` → books `[…]`, target null; `'ioan 99'` → `{JHN,
null,…}` (chapter out of range dropped); `'ioan 3 40'` drops the verse; `recentPassages` dedupes, ignores
      non-references, orders newest first, limits; `passagePrefill` lines and `missing`; picker: tap 16 then 18 → range,
      tap 12 after 16 → from 12, `justFrom`, `confirm` only when complete, `jump` complete → done, `toBooks` clears.
- [ ] Implement; delete `book-offer.*`. Commit `feat(bible): jump, recent passages and range picking`.

### Task 6: Picker UI

**Files:**

- Create: `ui/picker/JumpField.tsx`, `ui/picker/RecentChips.tsx`, `ui/picker/BookGrid.tsx`,
  `ui/picker/PassageGrid.tsx` (chapter + verse grids, one step), `ui/picker/PickerBreadcrumb.tsx`,
  `ui/picker/PassageSummary.tsx`, `ui/picker/genre-swatch.ts`, `ui/picker/PassagePicker.tsx` (composes them),
  `ui/picker/PassagePicker.test.tsx`
- Delete: `ui/BookPicker.tsx`, `ui/NumberGrid.tsx`

Behaviour:

- `BookGrid`: OT/NT headings; `grid-cols-6 gap-1.5`, tiles `min-h-11 rounded-control sw-tint` with
  `style={{ '--sw': GENRE_SWATCH[genre] }}` (`law: var(--sw-rose)`, `history: var(--sw-amber)`,
  `wisdom: var(--sw-emerald)`, `majorProphets: var(--sw-indigo)`, `minorProphets: var(--sw-teal)`,
  `gospels: var(--sw-red)`, `acts: var(--sw-plum)`, `pauline: var(--sw-blue)`, `general: var(--sw-cyan)`,
  `apocalyptic: var(--sw-gold)`); label = abbreviation, `aria-label` = full name (+ ", has text"); a 6px dot in the
  corner when the library holds text.
- `PassageGrid`: "Chapter" grid (dot = has text, selected = primary fill); when a chapter is picked the "Verses — tap
  the first, then the last" grid appears and scrolls into view (`scrollIntoView({ block: 'start', behavior })`, instant
  under reduced motion); range cells get `bg-primary/15`, ends `bg-primary text-primary-foreground`; `aria-pressed`;
  footer row: "Just verse N" (after first tap) and primary "Use Ioan 3:16–18" (enabled when complete).
- `PickerBreadcrumb`: `nav aria-label="Passage"`, segments are buttons (`Ioan` → `toBooks`, `3` → `edit`), current
  segment `aria-current="step"`; hidden at the book step with nothing picked.
- `JumpField`: search input (never autofocus), book-only → chips of `matchBooks`; a determined target → a "Go to
  {{ref}}" button; Enter submits.
- `RecentChips`: hidden when empty.
- `PassageSummary`: reference (title size), status line (`summaryAll` / `summarySome` / `summaryNone`), Change button.
- [ ] **Tests first** (`PassagePicker.test.tsx`): renders 66 tiles in two sections; picking Ioan shows chapters with a
      dot on chapters that have text; tapping 16 then 18 highlights 3 verses and enables "Use Ioan 3:16-18"; breadcrumb
      "Ioan" returns to books; typing `ioan 3 16` and Enter lands on done; recents render and jump to a chapter.
- [ ] Implement + i18n keys (`jumpLabel`, `jumpPlaceholder`, `goTo`, `recent`, `oldTestament`, `newTestament`,
      `chapter`, `verses`, `versesHint`, `justVerse`, `usePassage`, `passageNav`, `hasText`, `summaryAll_*`,
      `summarySome`, `summaryNone`, `change`). Commit `feat(bible): the passage picker`.

### Task 7: The import page

**Files:**

- Rewrite: `model/use-bible-import.ts` (+test), `ui/BibleImportPage.tsx` (+test), `ui/VerseTextPanel.tsx`,
  `testing/render-import-page.tsx`
- Create: `features/keep-missing-verses.ts` (+test)
- Delete: `features/publish-verses.ts`

**Interfaces:**

```ts
/** Saves the verses the Bible library lacks; never overwrites. Returns how many were saved. */
export async function keepMissingVerses(
  store: BibleVerseStore,
  verses: readonly BibleVerse[],
): Promise<number>
```

`useBibleImport` returns (changes): `picker`, `index: LibraryIndex`, `recents`, `jump(text)`, `summary: PassageText |
null`, `text/setText/prefilled`, `missing: number[]` (verses of the ref with no text in the box), `saveOffered`
(`versesToSave.length > 0`), `save` / `set('save', on)` (default on), plus today's split/duplicates/target fields.
`keepOffered`, `keep`, `isBookPickable`, `breadcrumb` are removed.

`add()`:

```ts
void addVerseCards(deps, { cards: addable, ref, target }).then(onReview, () =>
  toast.error(t('addFailed')),
)
if (save && versesToSave.length)
  void keepMissingVerses(verseStore, versesToSave).catch(() => toast.error(t('saveFailed')))
```

Page layout: header · (book/passage step) `PassagePicker` · (done) `PassageSummary` → `VerseTextPanel` (note lists
missing verses: `missingNote` "Verses 17, 19 have no text yet — type or paste after their numbers.") → split toggle
(ranges only) → "Save to Bible library" toggle (`saveOffered` only; hint "Next time these verses fill in by
themselves") → duplicates banner → placement → footer Add. The text panel is also shown at the book step (paste-first
path) but not during the passage step.

- [ ] **Tests first:** prefill from index one verse per line; a missing verse makes the save toggle appear and the note
      name it; Add with save on calls `keepMissingVerses` with only the missing verses and still navigates to review;
      save off saves nothing; no "Start over" anywhere; `keepMissingVerses` skips held ids.
- [ ] Implement. Commit `feat(bible): the import page picks, previews and saves what was missing`.

### Task 8: Extension settings instead of admin

**Files:**

- Modify: `src/shared/lib/extension-manifest.ts` (`admin` → `settings?: { route: ExtensionRoute }`),
  `src/app/router.tsx`, `src/app/extensions/extension-redirect.ts` (+test), `src/pages/settings-extensions/ui/
SettingsExtensionsPage.tsx` (+test), `src/shared/i18n/locales/en/settings.ts` (`extensionSettings: '{{name}}
settings'`), `src/extensions/bible/manifest.tsx`, `src/app/extensions/testing/fake-extension.tsx`

- [ ] **Tests first:** Extensions page shows a "Bible settings" nav row under an enabled extension (dev mode off too) and
      none when disabled; `extensionRedirect` sends an inactive extension's route to extension settings, and an active
      one's settings route through (no dev gate).
- [ ] Implement. Commit `refactor(extensions): an extension has settings, not a dev-only admin screen`.

### Task 9: The Bible settings page

**Files:**

- Create: `ui/BibleSettingsScreen.tsx`, `ui/BibleSettingsPage.tsx` (+test), `ui/settings/CoverageList.tsx`,
  `model/text-from-cards.ts` (+test)
- Delete: `ui/BibleLibraryScreen.tsx`, `ui/BibleLibraryPage.tsx` (+test)
- Modify: `manifest.tsx` (settings route `/settings/extensions/bible` → `BibleSettingsScreen`), `i18n/en.ts`

**Interface:**

```ts
export interface TextFromCards {
  fresh: BibleVerse[]
  held: number
  cards: number
}
/** The verses a set of cards would add to the library, split into new and already held. */
export function textFromCards(
  cards: readonly SourceCard[],
  index: LibraryIndex,
  at: string,
): TextFromCards
```

Sections: Translation row (`CORNILESCU_2024.name` · "Romanian") · "Bible library" coverage list (books with text: name,
"12 of 16 chapters · 437 verses", thin bar `bg-primary` on `bg-secondary`; "Show all books" reveals the rest) ·
actions "Add text from your cards" (confirm dialog with `textFromCards` preview: `addPreview` "{{fresh}} new verses
from {{cards}} cards. {{held}} already in your Bible library are kept.") and "Add text from one deck" (DestinationSheet
→ same dialog) · dev mode only: a "Forget" button per book row with a confirm dialog. Empty: `libraryEmpty` notice.
Loading: `ScreenLoading`. Footer note `offline`.

- [ ] **Tests first:** coverage rows for held books; preview counts; confirming saves only fresh verses; Forget hidden
      without dev mode and confirm-gated with it; empty state.
- [ ] Implement. Commit `feat(bible): a settings page with the translation, coverage and adding text from cards`.

### Task 10: Push rows carry their base; the server refuses unseen overwrites

**Files:**

- Create: `supabase/migrations/20260918120000_push_documents_base.sql`
- Modify: `src/shared/api/supabase/document-mapping.ts` (+test), `…/replication.ts` (+test),
  `…/sync-manager.ts` (+test), `src/shared/config/sync-tables.ts`, `src/app/composition-root.ts`,
  `…/replication.integration.test.ts`, `…/singleton-sync.integration.test.ts`

**Interfaces:**

```ts
export interface PushRow {
  id: string
  user_id: string
  data: Record<string, unknown>
  deleted: boolean
  base: string | null
}
export function docToRow<T extends Identifiable>(
  doc: T & { _deleted?: boolean },
  userId: string,
  base: string | null,
): PushRow
export function buildPushPayload<T extends Identifiable>(
  rows: RxReplicationWriteToMasterRow<T>[],
  userId: string,
): PushRow[]
// base = (row.assumedMasterState as { updatedAt?: unknown } | undefined)?.updatedAt as string ?? null
```

`refuseUnseenOverwrites` (option, `SyncTarget`, `SyncTableSpec`), `splitUnseenOverwrites` and the pre-push `select` are
deleted.

SQL (the function body; allow-list unchanged from `20260917120000_bible_verses.sql`):

```sql
with incoming as (
  select (select auth.uid()) as user_id, element->>'id' as id, element->'data' as data,
         coalesce((element->>'deleted')::boolean, false) as deleted,
         element ? 'base' as based, element->>'base' as base
  from jsonb_array_elements($1) as element
),
current as (
  select server.id, server.data, server.deleted from public.%1$I as server
  join incoming on incoming.id = server.id and incoming.user_id = server.user_id
  for update of server
),
accepted as (
  select incoming.* from incoming left join current on current.id = incoming.id
  where current.id is null
     or (current.data = incoming.data and current.deleted = incoming.deleted)
     or (incoming.based and current.data->>'updatedAt' is not distinct from incoming.base)
     or (not incoming.based
         and coalesce(current.data->>'updatedAt', '') <= coalesce(incoming.data->>'updatedAt', ''))
),
applied as (
  insert into public.%1$I as target (user_id, id, data, deleted)
  select user_id, id, data, deleted from accepted
  on conflict (user_id, id) do update set data = excluded.data, deleted = excluded.deleted
    where target.data->>'updatedAt' is not distinct from
          (select current.data->>'updatedAt' from current where current.id = excluded.id)
  returning target.id
)
select coalesce(jsonb_agg(jsonb_build_object('id', server.id, 'data', server.data,
         'deleted', server.deleted, 'updated_at', server.updated_at)), '[]'::jsonb)
from public.%1$I as server
join incoming on incoming.id = server.id and incoming.user_id = server.user_id
where server.id not in (select id from applied)
```

- [ ] **Tests first:** `buildPushPayload` carries `base` from `assumedMasterState.updatedAt` and `null` without one;
      `docToRow` shape; the replication push handler no longer selects before pushing; integration (skips without env):
      a row pushed with a stale `base` comes back refused, a matching `base` applies, a re-push of identical data applies,
      a row without `base` keeps the clock rule.
- [ ] Implement. Commit `fix(sync): a push says what it was based on, and the server refuses unseen overwrites`.

### Task 11: Merge field by field against the base

**Files:**

- Create: `src/shared/lib/merge-fields.ts` (+test)
- Modify: `src/shared/lib/merge-srs.ts` (+test), `src/shared/lib/merge-progress.ts` (+test),
  `src/entities/preferences/model/merge.ts` (+test), `src/shared/api/rxdb/conflict-handlers.ts` (+test),
  `src/app/persistence/conflict-handlers.ts` (+test), `src/app/persistence/database.ts`,
  `src/extensions/bible/api/verse-schema.ts`, `src/shared/lib/index.ts`

**Interfaces:**

```ts
export interface MergeFieldsOptions<T> {
  /** A field both sides changed: how to settle it. Default: the newer clock's value. */
  both?: { [K in keyof T]?: (mine: T[K], theirs: T[K], base: T[K]) => T[K] }
  /** Who wins a field both changed when no `both` rule covers it. */
  tie?: 'newer' | 'mine'
}
export function mergeFields<T extends Clocked>(
  mine: T,
  theirs: T,
  base: T,
  options?: MergeFieldsOptions<T>,
): T
// updatedAt = the later clock; keys = union of both sides (a key missing on one side is `undefined` there)

// shared/api/rxdb/conflict-handlers.ts
export function mergeAgainstBase<T extends Clocked>(): RxConflictHandler<T> // no base → newest(); replaces lastWriteWins
export function firstWriteWins<T extends Clocked>(): RxConflictHandler<T> // unchanged
```

Handlers: decks, folders, questions, profiles, bible verses → `mergeAgainstBase()`. cards → `mergeFields(…,{ both: {
srs: mergeSrs } })` with base, `mergeCard` without. progress → with base `mergeFields(…, { both: { xp: delta, streakFreezes:
delta, streakCount: max, longestStreak: max, bestQuizAccuracy: max, trainingDays: union, lastTrainingDate: maxDate } })`
and daily tally settled by `mergeDailyTally`; without base `mergeProgress`. preferences → `mergePreferences` implemented
with `mergeFields(mine, theirs, base ?? defaults, { tie: 'mine' })`. `_deleted` is merged as a field. `lastWriteWins` is
deleted once nothing uses it.

- [ ] **Tests first:** text edited on one side + srs on the other → both survive; both edited text → newer wins; deletion
      on one side, untouched other → deleted; XP 100 → A 110, B 120 → 130; freezes 2 → A 1, B 3 → 2; preferences tests
      stay green; bible verse text edited on one device, other untouched → kept.
- [ ] Implement. Commit `fix(sync): conflicts merge field by field against what each device saw`.

### Task 12: Every synced write is a Pending change

**Files:**

- Modify: `src/entities/pending-change/model/{types,selectors}.ts` (+tests), `index.ts`,
  `src/app/persistence/schemas.ts` (pending v2), `src/app/persistence/database.ts` (migration 2),
  `src/features/sync/create-pending-change-port.ts` (+test), `…/divergence.ts`, `…/keep-cloud-copy.ts`,
  `…/testing/fake-cloud.ts`, `src/shared/lib/entity-store.ts` (+test: singleton `pending`), entity store factories for
  progress, preferences, profile, history, `src/shared/lib/extension-manifest.ts` (`ExtensionContext.pending`),
  `src/app/extensions/extension-runtime.ts` (+test), `src/app/composition-root.ts`,
  `src/extensions/bible/model/store.ts`, `src/extensions/bible/runtime.ts`, `src/shared/config/sync-tables.ts`
  (`isContentCollection`, `labelKey`), `src/app/extensions/collections.ts`, `src/shared/lib/sync-runner.ts`
  (`tables: readonly SyncTableSpec[]` on the runner), `src/app/providers/SyncProvider.tsx`, `src/widgets/sync/ui/
SyncBanner.tsx` (+test), `docs/UBIQUITOUS_LANGUAGE.md`

**Interfaces:**

```ts
export interface PendingChange {
  id: string
  table: SyncedTable
  entityId: string
  op: 'save' | 'remove'
  at: string
}
export function makePendingChange(input: Omit<PendingChange, 'id'>): PendingChange // id `${table}:${entityId}`
export function pendingIn(changes: readonly PendingChange[], tables: readonly SyncedTable[]): PendingChange[]
export function pendingByTable(changes: readonly PendingChange[]): Record<string, number>
export function createPendingChangePort(store, table: SyncedTable, now): PendingChangePort
export function isContentCollection(table: string): table is ContentCollection
// ExtensionContext
pending: (collectionKey: string) => PendingChangePort // no-op for a collection with no table
// SyncTableSpec
labelKey?: string // contributed key for an extension table; core tables use `sync.tables.<table>`
```

Schema v2: `table: { type: 'string', maxLength: 100 }`, `indexes: ['table']`; migration
`2: ({ contentCollection, ...rest }) => ({ ...rest, table: contentCollection })` (v1's return type adjusted).

- [ ] **Tests first:** saving progress/preferences/profile/history/bible verse records a pending change on its table;
      the pending migration renames the field; divergence ignores non-content tables; the banner counts only live tables
      (a disabled extension's pending rows do not show); `clearConfirmed` clears every table's confirmed entries.
- [ ] Implement. Commit `fix(sync): every synced write waits in the pending log until a Sync confirms it`.

### Task 13: The other device pulls by itself; failed Autosync retries

**Files:**

- Modify: `src/app/providers/use-autosync.ts` (+ new `use-autosync.test.tsx`), `src/app/providers/SyncProvider.tsx`
  (+test), `src/shared/api/supabase/cloud-watcher.ts` (+test), `…/sync-manager.ts` (+test),
  `src/app/providers/use-data-transition.ts`, `src/features/session` (`applyDataTransition` signature)

**Interfaces:**

```ts
export interface CloudWatcherHandlers {
  onChange: (event: RemoteChangeEvent) => void
  onReconnect: () => void
}
export function createCloudWatcher(
  supabase,
  tables,
  userId,
  handlers: CloudWatcherHandlers,
): CloudWatcher
// postgres_changes filter: `user_id=eq.${userId}`; subscribe(status): SUBSCRIBED after an earlier SUBSCRIBED → onReconnect

export const AUTOSYNC_DEBOUNCE_MS = 4000
export const CLOUD_CHANGE_DEBOUNCE_MS = 3000
export const RETRY_DELAYS_MS = [15_000, 60_000, 300_000] as const
export function useAutosync(input: {
  active: boolean
  run: () => Promise<SyncOutcome>
  reconnects: number
}): void
```

Triggers when Autosync is on: online, visibility change, pagehide, a pending write (4 s debounce), `cloudChanged`
becoming true (3 s), a watcher reconnect (3 s). A `failed` outcome schedules the next retry delay (only while
`navigator.onLine` and `document.visibilityState === 'visible'`); a success resets the ladder.

- [ ] **Tests first (fake timers):** cloudChanged true → one run after 3 s; failed → retry at 15 s then 60 s; success
      resets; autosync off → nothing; watcher subscribes with the user filter and reports a reconnect only after the
      first subscription.
- [ ] Implement. Commit `fix(sync): Autosync pulls what changed elsewhere and retries what failed`.

### Task 14: Nothing hangs, nothing overflows

**Files:**

- Create: `src/shared/api/supabase/request-timeout.ts`, `src/shared/lib/chunk.ts` (+test)
- Modify: `…/replication.ts`, `…/peek.ts` (+test)

```ts
export const REQUEST_TIMEOUT_MS = 30_000
export const requestSignal = (): AbortSignal => AbortSignal.timeout(REQUEST_TIMEOUT_MS)
export function chunk<T>(items: readonly T[], size: number): T[][]
export const ID_BATCH = 100
```

Every sync PostgREST call gets `.abortSignal(requestSignal())`; `fetchRemoteDocuments` / `fetchRemoteParents` query per
chunk and concatenate.

- [ ] **Tests first:** `chunk` edge cases; 250 ids → 3 requests, results concatenated; each request carries a signal.
- [ ] Implement. Commit `fix(sync): every request times out, and id lookups go in batches`.

### Task 15: The sync log and the repair

**Files:**

- Modify: `src/entities/sync-state/model/types.ts` (+test), `…/selectors.ts`, `index.ts`, `src/app/persistence/
schemas.ts` (sync-state v3), `database.ts` (migration 3), `src/features/sync/sync-now.ts` (+test),
  `src/shared/api/cloud-sync-port.ts` (`forget`), `…/supabase/supabase-cloud-sync.ts`, `…/sync-manager.ts` (+test:
  `forget`), `…/replication.ts` (`autoStart` option), `src/features/sync/testing/fake-cloud.ts`,
  `src/shared/lib/sync-runner.ts` (`repair`), `src/app/providers/SyncProvider.tsx`
- Create: `src/features/sync/repair-sync.ts` (+test)

```ts
export type SyncLogOutcome = 'clean' | 'merged' | 'needs-review' | 'failed'
export interface SyncLogEntry {
  at: string
  outcome: SyncLogOutcome
  pushed: number
  pulled: number
  reason?: string
}
export const SYNC_LOG_LIMIT = 10
export function appendSyncLog(log: readonly SyncLogEntry[], entry: SyncLogEntry): SyncLogEntry[] // newest first, capped
export const selectSyncLog: (state: SyncStateState) => SyncLogEntry[]
// CloudSyncPort
forget(): Promise<void>
// features/sync
export async function repairSync(deps: SyncDeps): Promise<SyncOutcome>
// SyncRunner
repair: () => Promise<SyncOutcome>
```

- [ ] **Tests first:** a clean cycle logs pushed/pulled; a failed cycle logs its reason (state still saved); the log
      caps at 10; migration 3 adds `log: []`; `repairSync` calls `forget`, clears checkpoints and runs a cycle;
      `SyncManager.forget` removes each live target's replication meta and refuses while no account.
- [ ] Implement. Commit `feat(sync): a log of recent Syncs, and a repair that checks everything again`.

### Task 16: The Sync settings page

**Files:**

- Rewrite: `src/pages/settings-sync/ui/SettingsSyncPage.tsx` (+ new `SettingsSyncPage.test.tsx`)
- Create: `src/pages/settings-sync/ui/SyncStatusCard.tsx`, `…/WaitingSection.tsx`, `…/RecentSyncs.tsx`,
  `…/RepairSection.tsx`, `src/pages/settings-sync/model/status.ts` (+test)
- Modify: `src/shared/i18n/locales/en/sync.ts`

`syncStatus({ phase, waiting, online, error })` → `'syncing' | 'failed' | 'offline' | 'waiting' | 'synced'` drives the
card (icon, tone, title, detail = last Sync / reason, account email, Synchronise). Waiting rows per live table
(`sync.tables.*` / contributed `labelKey`); content rows open a `Sheet` listing item labels (`contentLabel`), others
show only the count. Recent syncs: time (relative), outcome chip, "↑{{pushed}} ↓{{pulled}}". Repair: "Review pending
changes" (existing flow) and "Check everything against the cloud" (ConfirmDialog → `runner.repair()`, toast on
outcome). Guest / no cloud notices stay.

- [ ] **Tests first:** status derivation table; waiting rows per table incl. Study progress; tapping Cards lists card
      fronts; recent log renders entries; repair confirm calls `repair`.
- [ ] Implement. Commit `feat(sync): a Sync page that says what is waiting, what happened and how to repair it`.

### Task 17: Docs, migration, verification

**Files:**

- Create: `docs/adr/0005-merge-against-what-you-saw.md`
- Modify: `docs/UBIQUITOUS_LANGUAGE.md` (Pending change → any synced table, `table`; Translation; Book code; Recent
  passage; Bible settings), `docs/superpowers/specs/2026-09-15-offline-sync-and-account-lifecycle-design.md` (pointer
  to ADR 0005), `CLAUDE.md` (pending goes to every synced store; `settings` on manifests)

- [ ] Write the docs. Ask before applying the migration to the Supabase project; apply with `apply_migration` once
      approved and verify `push_documents` with a `base` row via SQL.
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build && npm run check:entry-graph` → all green.
- [ ] Commit `docs: merge against what you saw, and the vocabulary that came with it`.
