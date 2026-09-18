# Bible in Romanian, a better picker, and a Sync that tells the truth — design

Date: 2026-09-18 · Status: approved in conversation · Supersedes parts of
`2026-09-17-extensions-and-bible-add-cards-design.md` (the admin library, the disabled books, "Keep this text").

## Why

Five complaints, one session:

1. **Published text never reaches the picker.** Verified against the cloud: 939 verses are published, stored under the
   Romanian book names the learner's decks use (`1 Corinteni`, `Efeseni`) and translation `web`. The picker's canon is
   English (`1 Corinthians`), so `read()` and `books()` never match, every book greys out, and nothing prefills. The
   translation id is also wrong — the text is Cornilescu, not the World English Bible.
2. **References must be Romanian.** The one translation is _Biblia Dumitru Cornilescu 2024_; book names, references and
   deck names follow the translation, not the UI language (which stays English).
3. **The import page is hard to use.** "Start over" is always on screen, every book is a full-width row, chapter and
   verse are separate steps, missing text is only discoverable after picking, and saving pasted text is dev-only.
4. **Sync says "Everything is synchronised" while it is not.** Three verified causes:
   - _Lost updates._ `grade-card.ts` saves the whole card with a new `updatedAt`; `push_documents` accepts any newer
     clock and `mergeCard` / `lastWriteWins` keep the newer _whole document_. Studying a card on a device that has not
     pulled an edit made elsewhere silently writes the old text back over it. Same class for decks, folders, questions,
     profile, and XP (`mergeProgress` takes `max`, losing one side's increment).
   - _Unsent writes are invisible._ Only the four content stores write to the pending log. Bible verses, progress,
     preferences, profile and history writes neither start Autosync nor show as waiting, so the banner reports
     "synchronised" with unsent rows.
   - _The other device waits._ A Realtime change only raises the "changed on another device" banner; nothing pulls
     until the learner taps.
   - Also: no request has a timeout (one hung fetch leaves "Synchronising…" forever and every later Sync joins it), and
     `.in('id', …)` lookups grow without bound.
5. **The Sync settings page says too little** to answer "did it sync?".

## Decisions

### 0. Remove "Clean references from backs"

The learner already cleaned their decks. Delete `features/clean-reference-backs.ts`, `model/reference-backs.ts`, their
tests, the library button/sheet/dialog and the i18n keys. `model/strip-reference.ts` stays — the verse parser uses it.
Own commit.

### 1. Canon keyed by code; names belong to the translation

- `model/canon.ts`: 66 books as `{ code, testament, genre, verses[] }`. Codes are USFM-style (`GEN` … `REV`, `1CO`,
  `SNG`). Genres: `law · history · wisdom · majorProphets · minorProphets · gospels · acts · pauline · general ·
apocalyptic`. Verse counts unchanged (Cornilescu follows the KJV versification).
- `model/translations.ts`: the translation registry. One entry, `cornilescu-2024`: name _Biblia Dumitru Cornilescu
  2024_, short name _Cornilescu 2024_, language `ro`, and per book `{ name, abbreviation }` (`1 Corinteni`, `1Cor`).
  Proper nouns, not UI copy, so they do not live in i18n. `DEFAULT_TRANSLATION = 'cornilescu-2024'`.
- `model/book-names.ts`: `bookName(code)`, `bookAbbreviation(code)` for the default translation, and
  `resolveBook(text)` — diacritic-, case-, space- and dot-insensitive lookup over every alias (Romanian name,
  abbreviation, the English canon names). `matchBooks(prefix)` powers the jump field.
- `VerseRef.book` becomes a `BookCode`. `formatRef` prints the translation's name (`1 Corinteni 8:9`); `parseRef`
  resolves through `resolveBook`, so existing card fronts parse. Deck names (`chapterDeckName`) and automatic placement
  use the Romanian names — the learner's existing decks match.
- A verse: `{ translation: 'cornilescu-2024', book: '1CO', chapter, verse, text }`, id
  `cornilescu-2024:1CO:8:9`.

**Persisted data.** 939 rows in the cloud (and on every device) carry `web` and a book _name_. The shape is unchanged,
so no schema version bump; the meaning of `book` and the id change:

- Read-side twin `completeBibleVerse`: `translation 'web' → 'cornilescu-2024'`, `book` name → code via `resolveBook`.
  Rows pulled unmigrated read correctly at once.
- Keeper `keep-verses-canonical.ts`, started by the extension's `activate` and stopped by `deactivate`: for every row
  whose id is not `refKey(translation, book, chapter, verse)` of its completed self, save the canonical row (unless a
  canonical row already exists with a newer `updatedAt`) and remove the old one. Both writes replicate; the keeper is
  idempotent, so two devices converging on it write the same ids.
- A row whose book resolves to nothing is left alone and never offered (it cannot be addressed).

### 2. The passage picker and the import page

Inline stepper that collapses (chosen). Visual world inherited — no new tokens.

- **Jump field** at the top: `ioan 3 16-18`, `1cor13`, `ps 23`, `Ioan 3:16`. Book-only input shows matching books as
  chips; a complete or partial reference offers "Go to …" and Enter jumps to the furthest step it determines.
- **Recent**: up to 6 chips of `book chapter`, derived from the library's most recently created cards whose front parses
  as a reference. No new storage; it syncs with the cards.
- **Books**: Old / New Testament sections, a 6-column grid of abbreviation tiles (≥44px), each tinted by genre with the
  existing swatch palette (`.sw-tint` + `--sw-*`, light and dark already handled). A dot marks books the Bible library
  holds text for. No book is ever disabled — pasting is how the library grows.
- **Chapter and verses on one step**: chapter grid (dot = the chapter has text); picking one reveals the verse grid
  below it and scrolls it into view (dot = the verse has text). Tap the first verse, then the last; the range is
  highlighted; "Just verse N" after the first tap; "Use Ioan 3:16–18" confirms.
- **Breadcrumb** (`Ioan › 3 › 16–18`): each segment returns to its step. Shown only once something is picked.
  "Start over" and "Change verses" are gone.
- **Summary card** after picking: the reference, "3 verses · 2 in your Bible library" (or "All 3 in your Bible
  library" / "Not in your Bible library yet"), and Change.
- **Verse text**: prefilled one verse per line (`16) …`); a missing verse is prefilled as its bare marker (`17) `) and
  the note says which verses still need text. The Add count counts only verses with text.
- **Save to Bible library** toggle, on by default, shown only when the text supplies verses the library lacks. On Add
  it saves exactly those (`keepMissingVerses` — never overwrites) before handing the cards to import review. The
  dev-only "Keep this text" and `book-offer.ts` are deleted.
- Split, duplicates and placement stay, grouped under the text.

### 3. The Bible settings page

- `ExtensionManifest.admin` is replaced by `settings?: { route: ExtensionRoute }` — an ordinary screen, not dev-only.
  The Extensions page shows a "Settings" nav row under an enabled extension's toggle. `extensionRedirect` loses its
  `admin` branch; the router loses `devOnly` for extensions.
- `/settings/extensions/bible` — `BibleSettingsPage`:
  - **Translation**: _Biblia Dumitru Cornilescu 2024_ · Romanian (read-only; one translation today).
  - **Bible library**: coverage per book (chapters with text / chapters, verses held), grouped OT/NT, books with no
    text collapsed behind "Show all books".
  - **Add text from your cards**: scans every card whose front is a single verse reference; a confirm dialog previews
    "N new verses from M cards · K already in your Bible library are kept"; never overwrites. **Add text from one
    deck** does the same for a deck picked in `DestinationSheet`.
  - **Forget a book** (dev mode only): removes a book's verses.
  - Loading, empty ("No Bible text yet — add a passage or add text from your cards"), works offline (every write is
    local).

### 4. Sync engine

**4a. Field-level merge against a base (fixes lost updates).**

- Every pushed row carries `base`: the `updatedAt` of the server copy this device last saw
  (`assumedMasterState?.updatedAt ?? null`).
- `push_documents` (new migration): a row **with** `base` applies when the server has no copy, holds identical data
  (idempotent re-push), or its clock equals `base`; otherwise it is refused and returned. The update re-checks the clock
  under the row lock, so a concurrent write cannot slip between check and write. A row **without** `base` keeps the
  clock rule — that branch serves app builds shipped before this one and is dropped by a later migration once they are
  gone.
- Conflict handlers merge field by field against `assumedMasterState` (`shared/lib/merge-fields.ts`): a field only one
  side changed takes that side; a field both changed goes to the newer clock; the merged clock is the later one. No
  base → the newer whole document (today's rule).
  - cards: plus `srs` merged as today when both changed;
  - progress: `xp` and `streakFreezes` merge as deltas from the base (`base + Δmine + Δtheirs`), the rest as today;
  - preferences: `mergePreferences` becomes `mergeFields` with the "mine wins a tie" policy and the defaults as the
    missing base;
  - history: first write wins (unchanged).
- `refuseUnseenOverwrites`, `splitUnseenOverwrites` and the extra `select` before a push are deleted — the server does
  it atomically for every table.

**4b. Every synced write is a Pending change.**

- `PendingChange.contentCollection` → `table: SyncedTable` (schema v2, migration renames the field). Divergence logic
  filters to content collections (`isContentCollection`).
- Every synced store records: `createSingletonStore` gains `pending`; the history store gets it; `ExtensionContext`
  gains `pending(key)` (a no-op port for a local-only collection) and the Bible verse store uses it.
- The banner and the Sync page count pending changes for the **live** tables only (a disabled extension's rows wait
  without holding the banner).

**4c. The other device pulls by itself.**

- With Autosync on, `cloudChanged` becoming true (a Realtime event, or a cycle that saw a foreign change land after
  its pull) starts a Sync after a 3 s debounce.
- The watcher subscribes with a `user_id=eq.<id>` filter, and a re-subscription after a drop counts as a possible
  change (events may have been missed while down).
- A failed Autosync cycle retries with backoff (15 s, 60 s, 5 min) while online and visible; any success resets it.

**4d. Nothing hangs.** Every PostgREST call made by sync (pull, push, peek, parents, fetch) carries
`AbortSignal.timeout(30 s)`. A timed-out request fails the cycle like any other error; the in-flight promise clears.

**4e. Bounded lookups.** `.in('id', …)` is chunked (100 ids per request) in `fetchRemoteDocuments` and
`fetchRemoteParents`.

### 5. The Sync settings page

- **Status card**: state (Synchronised · N changes waiting · Synchronising… · Offline · Did not finish + reason),
  last Sync time, the account's email, and the Synchronise button.
- **Waiting on this device**: one row per table with pending changes (Decks, Cards, Folders, Questions, Study progress,
  Settings, Profile, Study history, and contributed tables by their label). Content rows open a sheet listing the items
  by name.
- **Recent syncs**: the last 10 cycles on this device — when, outcome, pushed and pulled counts. Stored in `syncState.log`
  (device-local; schema v3 adds `log: []`, `completeSyncState` defaults it).
- **Autosync** toggle (unchanged).
- **Repair · Check everything against the cloud**: confirm dialog, then `repairSync` — has the next cycle pull every
  replication from the first document (`SyncManager.rereadEverything`; the pull handler passes over the checkpoint,
  never `replicationState.remove()`, which would drop every `assumedMasterState` with it — ADR 0005), clears the
  sync-state checkpoints, and runs a Sync.
  Every document is pulled again and every local document reconciled through the merge above; unsynced changes are
  kept. **Review pending changes** moves here.

## Architecture notes

- Everything Bible stays inside `src/extensions/bible`; core learns only `settings` on the manifest, `pending` on the
  context, and a `labelKey` on `SyncTableSpec` / `ExtensionCollectionSpec` for the Sync page.
- New ADR `0005-merge-against-what-you-saw.md` records 4a; the offline-sync spec and `UBIQUITOUS_LANGUAGE.md`
  (Pending change, Translation, Book code, Recent passage) are updated.

## Testing

TDD per unit: canon/names/`resolveBook`/`matchBooks`, `parseRef`/`formatRef`, the keeper, `completeBibleVerse`,
jump-field parsing, recents, coverage, `keepMissingVerses`, `mergeFields` + each handler, `buildPushPayload` base,
the pending port on every store, pending-schema migration, the Autosync triggers and backoff, chunking, the sync log,
`repairSync`. UI tests for the picker, import page, Bible settings page, Extensions page, Sync page. The
`push_documents` base rule gets an integration test (skips without `SUPABASE_TEST_*`). Done means
`npm run typecheck && npm run lint && npm run test && npm run build && npm run check:entry-graph` green.

## Rollout

The Supabase migration is additive and back-compatible (rows without `base` behave as before); it is applied to the
project before the client ships. Old builds keep syncing; new builds merge.
