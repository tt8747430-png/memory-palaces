# Keyboard elevation model + flashcard-mode fixes

Status: approved · Date: 2026-07-14

Follow-up to [the flashcard-modes / card-scroll spec](./2026-07-13-flashcard-modes-and-card-scroll-design.md). That spec assumed `interactive-widget=resizes-content` (the keyboard shrinks the frame automatically). The app shipped `interactive-widget=resizes-visual` instead, with a manual `--kb` variable, so keyboard avoidance became something each surface opts into. This records the resulting decisions plus four smaller mode fixes.

## Keyboard elevation — only sheets lift

**Decision.** The on-screen keyboard lifts **only bottom sheets**. No full-page surface shrinks or floats for the keyboard anymore.

- `useKeyboardInset` still publishes `--kb` (the keyboard's overlap into the layout viewport). Only `Sheet` reads it.
- The whole-page shrink (`.kb-fit`) is removed: from the study screen, the three editors, the two settings pages, and import review. `AppScreen` drops its `keyboard` prop; the `.kb-fit` CSS, `data-overlay`, and `useOverlayLock` are deleted as dead once nothing shrinks.
- A full page therefore holds still and lets the keyboard overlay its lower edge. This is what the study Type modes needed — the card no longer jumps up when the input is focused.

**Consequence — page-level primary actions move to the header.** A page that pinned its primary action to a bottom bar would hide that bar behind the keyboard once the page stops shrinking. Those actions move into the `ScreenHeader` `action` slot (where the card editor's Save already lived):

- Question editor **Save**, paste-notes **Create**, import-review **Import** → header `action`.
- Card editor keeps Save in the header; its bottom prev/next nav is not a primary action and may sit under the keyboard while typing.
- The two settings pages keep their submit inline in the scroll flow — it scrolls into reach, no bar to relocate.

**The app must not slide up, and the sheet must sit flush.** iOS Safari does not support `interactive-widget`, treats `position: fixed` as static once the keyboard is up, and scrolls the page to reveal the focused field — dragging the whole fixed shell (header included) off the top, and floating a hand-positioned sheet with a gap. Two separate mechanisms are needed, because a full page and a bottom sheet want opposite things.

- **Full pages are pinned.** `useKeyboardPin` (mounted in `RootLayout`) snaps the document scroll back to 0 on every visual-viewport change, and `html`/`body` carry `overflow: hidden` so there is no document scroll surface. `#root` stays full-size and still — the keyboard just overlays its lower edge (the study Type modes rely on this; the card must not lift). The app's own scrollers (`<main>`, a sheet body) are separate elements and keep working, so a field lower in a form is still reachable.
- **Sheets are a drawer library.** Hand-positioning a `position: fixed` sheet with a `bottom` offset cannot win on iOS — the element is no longer fixed, so it opens behind the keyboard and only appears after a manual scroll, with a gap. `Sheet` is now built on **Vaul**, whose `repositionInputs` lifts the drawer above the keyboard from the visual viewport (the approach that actually works). `Sheet`'s public API is unchanged, so all consumers (including `PromptSheet` — the New-deck sheet) are untouched. `handleOnly` keeps the dismiss drag on the grab handle so sheet controls aren't hijacked; `noBodyStyles` leaves scroll-locking to the app shell. The `--kb` variable and the old `useKeyboardInset` hook are retired. `ActionSheet` (menu-only, no inputs) still uses the base-ui dialog + `useDragToDismiss`.

## Type-words evaluation — a typo stays in place

`alignWords` (word-level edit distance) tie-broke a mistyped word toward "skip this expected word (missing)", which cascaded a run of later words to orange and paired the typo with a distant same-cost match. The reconstruction now prefers an optimal substitution **when the two words are near** (`nearWord`: ≤2 character edits and sharing more than they differ) — a real typo shows `wrong` at its own spot and the next word can still be `correct`. Genuine skips/interjections (dissimilar words) keep the previous `missing`/`extra` behavior. Covered by `recall.test.ts` (single-letter typo, transposition).

## Type & Rebuild always open on the front face

The mode-sheet handler already dispatched `unflip`, but `mode` is a persisted preference that round-trips through RxDB, so a single handler was not a guarantee. `FlashcardsPanel` now also dispatches `unflip` from an effect keyed on the effective `mode`, so switching into any mode lands on its front face regardless of the path.

## Blur mode — equal buttons

Blur / Show all are laid out in a content-sized `inline-grid grid-flow-col auto-cols-fr`, so both size to the wider label and read as one balanced control.

## Card editor — prev/next spans the subtree

The editor's neighbour tour used `cardsForDeck` (direct children only), so opening a card from a parent deck whose cards live in subdecks showed no navigation. It now uses `cardsInSubtree`, matching the card list on the deck page.
