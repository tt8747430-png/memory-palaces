# Flashcard modes: flip lifecycle, Type mode, and card scrolling

Status: approved · Date: 2026-07-13

Two reported problems in the study session, plus the polish they imply.

1. Type and Rebuild inherit the flipped state when you switch modes, so they open on the
   answer face. Once solved they stay flippable, and the "Solved — tap to see the answer"
   badge advertises an affordance that shouldn't exist.
2. The feedback box in Type mode cannot be scrolled reliably, and dragging inside it swipes
   the card instead. Card content does not adapt to arbitrary length.

## Flip lifecycle

**Mode change clears the flip.** `flipped` lives in the session reducer, but `StudyDeck` is
keyed by `${mode}-${cardId}`, so a mode change resets the deck's local `solved`/`peek` while
`state.flipped` survives — the new mode opens on its back face. `ModeSheet`'s `onMode`
handler in `FlashcardsPanel` dispatches `unflip` before calling `onModeChange`. The mode
sheet is the only in-session path that changes mode, so this is an event handler, not a
syncing effect.

**Solve is terminal.** `StudyDeck` drops the `peek` state. `showBack` becomes
`!solved && flipped`; `handleFlip` is a no-op while `solved`.

- A solved card does not flip. Its front already shows the full answer.
- `SolvedBadge` is deleted. The completed answer and the footer Reset button are the state.
- Grade buttons still appear: solving dispatches `reveal`, which sets `flipped: true`.
- **Reset** — footer button or the configured swipe — is the only exit. It clears the
  input/chips, un-solves, and dispatches `unflip`, returning the footer to remaining counts.
- The "Where to picture" hint is unreachable once solved. It stays reachable before solving
  through the give-up flip, which is kept.

The rule holds for all three producing modes: Rebuild, Type-initials, Type-free-text.

## Type mode

Both halves of the existing `initialsOnly` toggle are kept.

**Free text.** The textarea auto-grows instead of scrolling internally. The diff panel loses
its `max-h-44 overflow-y-auto` box and its floating corner Reset; it becomes an inline
transcript that flows in the card body, and Reset moves to the footer as an `AidButton`,
matching Rebuild and initials. `typedRecallStatus` gains LCS alignment: a skipped or extra
word is reported as `missing`/`extra` at its own position instead of cascading every later
word to `wrong`. The `nextWord` aid — already a configurable swipe action for `type`, but
dead unless initials-only was on — appends the next expected word to the textarea.

**Initials.** The letter-cue mechanic is unchanged. Its transcript loses its own scroller,
and the mechanic moves out of the UI into `model/use-typed-recall.ts`.

**Decomposition.** `card-faces.tsx` (1013 lines: frame, six faces, shared chrome, a state
hook) becomes a `faces/` folder — one file per face, `CardFace` and shared chrome together,
the recall hook in `model/`. Behavior-preserving.

## Card scrolling

**A card face has exactly one scroller: the body between the header and the footer.** No
descendant of it may declare `overflow`.

- The three nested scrollers are removed: the type diff panel, the initials transcript, and
  the textarea's internal scroll.
- The body keeps its measured `touch-action` (`none` when content fits, `pan-y` when it
  overflows) plus `overscroll-behavior: contain`. With no nested scrollers the measurement is
  correct — previously the panel could need to scroll while the body reported it fit, setting
  `touch-action: none` on the ancestor and killing panning in the descendant.
- **Swipe vs. scroll.** A drag starting inside the scroll region is axis-locked to
  horizontal: left/right still grade, vertical belongs to the browser. Previously such a drag
  was fully disarmed — and the diff panel was not even tagged as a scroller, so scrolling it
  swiped the card.
- **Centering.** `justify-center` on an `overflow-y-auto` box clips the top of tall content
  and makes it unreachable. An inner `m-auto` wrapper replaces it: short content centers,
  tall content scrolls end to end. The overflow measurement observes that wrapper.
- The document already cannot scroll (`#root { position: fixed; inset: 0 }`, `body {
overflow: hidden }`), and the viewport meta sets `interactive-widget=resizes-content`, so
  the keyboard shrinks the frame rather than scrolling the page. With the body as the only
  scroller in the subtree, the card is a header/body/footer frame that adapts to any content.

## Testing

- `recall.test.ts` covers the aligned diff: skipped word, extra word, substitution, and that
  a single omission no longer cascades.
- `FlashcardsPanel.test.tsx` covers that a mode change lands on the front face, and that a
  solved card does not flip while Reset restores it.
