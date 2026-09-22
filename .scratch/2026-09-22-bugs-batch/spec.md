# 2026-09-22 bugs batch — approved design (uncommitted working tree)

Source: docs/3.Fixed_Bugs.md (top block, moved from docs/2.Bugs.md) + the design approved in chat.

1. Bible publishing → developer only. Import page: Save toggle + `keepMissingVerses` gone; Add makes cards only.
   Overview: no Bible library section at all (later amendment). Developer page: "Bible library" section
   (translation + Text saved N verses · M books), "Publish text" rows (add from cards / one deck, deck sheet,
   confirm), then the coverage list WITHOUT a framing SettingsSection (later amendment).
2. Library sort only in select mode. Select mode bar: [Sort ▾][Show ▾][All subdecks] + "N of M shown".
   Prefs schema 6→7: `subdeckSorts: Record<deckId, DeckSort>`, `deckSort` open to extension ids (read twin
   `resolveSubdeckSorts`). Order for children of P = subdeckSorts[P] ?? (deckSortSubdecks ? deckSort : manual);
   top level = deckSort. Drag only where that level is manual (rows fixed otherwise); "drag resets to manual" removed.
   New deck action `sortSubdecks` (swipe rail candidate, only when the deck has subdecks) → select mode scoped to that
   deck's direct children; the sort dropdown there writes subdeckSorts[deck] and sets deckSortSubdecks=false;
   ticking "All subdecks" writes {deckSortSubdecks:true, subdeckSorts:{}}. Filter transient (All/Favourites/Due +
   contributed), select-all respects it, leaving selection clears scope+filter.
3. Tap-to-answer: ZoneHints deleted. Config gains `centre` (tap mode only): edge actions + 'flip', default 'none'.
   Front: centre always flips. Back: runs centre. Gear sheet 5th row "Tap the middle" only in tap mode.
   `normalizeFlashcardSwipe` fills it. Swipe mode unchanged.
4. One BottomDock mounted by AppNav; pill never fades; pages borrow it via BottomSlot (portal into the dock's content
   layer, shared/lib/bottom-slot.ts store); only contents cross-fade (0.2s / 0 reduced-motion). Refcounted inset gone;
   useHideAppNav gone.
5. SelectToolbar slots = accent tile (ACTION_ACCENT fill/ink) over label; SelectToolbarSlot exported; ToolbarEditor
   preview renders the real DockPill + slots. DockPill clips only its glass, not contents (later amendment).
6. Extension point `deckSorts` ({id,labelKey,icon,feature?,rank,group?}); Bible contributes Biblical order (groups
   Old/New Testament) and By kind (genres). Ranked first, unranked after by name; chapters by number. Dropdown =
   core + contributed after a divider. DeckTree + LibrarySelectList print group headings for top-level rows. Stored
   id whose extension is off → effective manual. Extension point `deckFilters` ({id,labelKey,icon,feature?,keep});
   Bible contributes Old/New Testament + ten kinds (later addition).
7. Study undo → `flipped:false`.
8. Sync failure classification: Abort/Timeout/Failed to fetch/Load failed/NetworkError → reason code `network`;
   copy "The connection dropped or timed out. The next Sync will try again." Same mapping in quiet sync + review items.
9. `compareNatural` (Intl.Collator numeric, base) for every name sort (decks, content, folders, bible chapters).
10. Blending panels: `noteSurface` (frosted bg-card-glass + border-border + shadow-rest, later amendment from the
    info tint) for Help/Privacy/Sync notes; `ToggleRow surface="card"|"tint"|"plain"`; rule in CODE_STYLE §5.
11. Swipe settings: one ActionPalette with a full-width "Add to" two-way segment (→ Swipe right / ← Swipe left with
    slot counts); chips wear the arrow of their side; tapping an on-chip removes it.
12. DestinationSheet: gap-1.5 between the +/− toggle and the row so the selected tint clears the glyph.

## Shipped alongside (not asked for above)

- `app/persistence/keep-subdeck-orders-owned.ts` — forgets a `subdeckSorts` entry whose deck is deleted, keeps an
  archived one. Item 2's map needed it: CLAUDE.md's keeper rule (a repair one document can't decide alone).
- `mergeVisibleOrder` (`shared/lib/order.ts`) + the `siblingDecks` level lookup in `use-library-actions.ts` — a drag on
  a *filtered* level writes back over the whole level. Item 2's transient filter created the case.
