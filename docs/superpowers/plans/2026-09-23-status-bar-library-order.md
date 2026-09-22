# Status bar, one Library order, no stranded decks — Implementation Plan

> **For agentic workers:** executed natively in the session that wrote it (superpowers:executing-plans).
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the eight reports in the spec at their causes.

**Architecture:** The page paints under a translucent status bar with an anchored top inset; one
pure `arrangeLibrary` feeds every list of decks; stranded decks are made reachable read-side and the
Sync divergence check sees moved-in descendants; drawers never pre-select text; the header search
slides instead of wiping.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Tailwind v4, Base UI 1.7, motion 12, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-09-23-status-bar-library-order-design.md`

## Global Constraints

- FSD boundaries: `app → pages → widgets → features → entities → shared`; cross-slice via barrels.
- No legacy: delete what is replaced (`useAutoSelect`, `library-filter.ts`, `tree-flatten.ts`'s
  arrange callback, `HeaderBar`'s `study` layout, `statusBarIsPainted`).
- Persisted data untouched: no schema change; stranded decks are repaired read-side only.
- Semantic tokens only; `prefers-reduced-motion` honoured; safe areas via `--safe-top`.
- `npx prettier --write` on touched `src/` files only.

## Review Focus

1. A deck whose folder arrives in a later pull than the deck — must move into the folder once it
   lands (read-side repair, no write). Test in `deck-tree.test.ts`.
2. A filter that hides every top-level deck in the move sheet — the sheet still says why it is bare.
   Test in `DestinationSheet.test.tsx`.
3. An empty prompt with no suggestion — Create stays disabled. Test in `PromptSheet.test.tsx`.
4. A top inset that reports 0 after a larger one in the same shape — the held value stands. Test in
   `top-inset.test.ts`.
5. A Sync where a held deck moved into a deleted folder has cards — Delete must take the cards.
   Test in `sync-now.test.ts`.

---

### Task 1: `reachableDecks`

**Files:** Modify `src/shared/lib/deck-tree.ts`, `src/shared/lib/index.ts`; Test
`src/shared/lib/deck-tree.test.ts`.

**Produces:** `reachableDecks<T extends TreeDeck>(decks: readonly T[], folderIds: ReadonlySet<string>): T[]`.

- [ ] Tests: dead folder → top; dead parent → top; archived parent → top; two-deck cycle → both top;
      untouched decks keep identity; archived decks untouched.
- [ ] Implement; run `npx vitest run src/shared/lib/deck-tree.test.ts`.

### Task 2: `arrangeLibrary`

**Files:** Create `src/shared/lib/library-arrangement.ts` (+ test); delete
`src/shared/lib/tree-flatten.ts` (+ test), `src/pages/deck-library/model/library-filter.ts` (+ test).

**Produces:**

```ts
type ShelfPlace = { folderId: string | null } | { deckId: string }
interface Shelf<D> { decks: D[]; levelDecks: D[]; hidden: number; headings: ReadonlyMap<string, DeckGroup> }
interface LibraryArrangement<D, F> {
  decks: D[]; folders: F[]
  shelf(place: ShelfPlace): Shelf<D>
  subdecks(deckId: string): D[]
  orderAt(parentId: string | null): ResolvedOrder
  flatten(place: ShelfPlace, expanded: ReadonlySet<string>): FlatDeck[]
}
arrangeLibrary<D, F>(input: { decks; folders; prefs: LibraryOrderPreferences; orders; filters; dueOf }): LibraryArrangement<D, F>
filterDecks(decks, filter, dueOf, contributed)
needsDueCounts(prefs): boolean
```

- [ ] Tests: folder order; top shelf sorted/filtered/headed; folder shelf; scope shelf; subdecks by
      own order, unfiltered; flatten honours expanded; stranded deck on the top shelf.
- [ ] Implement; move `filterDecks` + its tests.

### Task 3: `useLibraryArrangement`, move sheet, switcher

**Files:** Create `src/widgets/deck-tree/model/use-library-arrangement.ts`; move
`FilteredNotice` to `src/widgets/deck-tree/ui/FilteredNotice.tsx`; modify `DestinationSheet.tsx`,
`DeckSwitcher.tsx`, `index.ts`; tests beside them.

- [ ] Hook reads `selectDeckSort`, `selectDeckSortSubdecks`, `selectSubdeckSorts`,
      `selectDeckFilter`, `useExtensionPoint('deckSorts'|'deckFilters')`, cards; due counts only when
      `needsDueCounts`.
- [ ] Sheet: Archive, Home, folders + shelves, top shelf; `GroupHeading`s; filter line.
- [ ] Switcher: `subdecks(deck.id)`.

### Task 4: Library page on the arrangement

**Files:** Modify `src/pages/deck-library/model/use-library-data.ts`, `DeckLibraryPage.tsx`.

- [ ] View derives from `useLibraryArrangement(patchedDecks, patchedFolders)`; existing
      `use-library.test.tsx` stays green.

### Task 5: Sync sees moved-in descendants

**Files:** Modify `src/features/sync/divergence.ts`; Test `sync-now.test.ts`.

- [ ] Test: held deck moved into a deleted folder elsewhere → needs-review with the deck and its
      local cards as descendants; Delete removes the cards.
- [ ] Drop `!here.has`; add local subtrees of found decks.

### Task 6: Duplicates only count reachable cards

**Files:** Modify `src/extensions/bible/model/use-bible-import.ts` (pass cards whose deck exists).

### Task 7: No pre-selected text

**Files:** Delete `src/shared/lib/use-auto-select.ts`; modify `PromptSheet.tsx`,
`AppearanceFields.tsx`, `FolderSheet.tsx`, `DeleteAccountSheet.tsx`, callers, kitchen sink; tests.

- [ ] `PromptSheet` `suggestion`: placeholder + fallback. `AppearanceFields` `suggestion`.

### Task 8: Search slides in

**Files:** Modify `src/shared/ui/header/HeaderSearch.tsx` (+ test).

### Task 9: Translucent status bar, anchored top inset

**Files:** Create `src/shared/lib/top-inset.ts` (+ test), `src/shared/lib/use-top-inset.ts`,
`src/shared/ui/StatusBarScrim.tsx`, `docs/adr/0006-the-page-paints-the-status-bar.md`; modify
`index.html`, `vite.config.ts`, `src/styles/theme.css`, `src/styles/tokens.css`,
`src/app/Bootstrap.tsx`, `src/app/providers/boot-paint.ts` (+ test), `src/shared/lib/status-bar.ts`
(+ test), dev-probe sample/text (+ tests), raw `env(safe-area-inset-top)` users, `AuthScreen.tsx`,
docs.

### Task 10: Study header

**Files:** Modify `StudySessionHeader.tsx`, `Header.tsx`, `CardScene.tsx`, `card-style/index.ts`,
`FlashcardsPanel.tsx`, `StyleFullscreen.tsx`, `QuizPanel.tsx`, `MatchBoard.tsx`; tests; CODE_STYLE §4a.

### Task 11: Verify

- [ ] `npm run typecheck && npm run lint && npm run test && npm run build && npm run check:entry-graph`.
