# One bottom slot, answering by tap, and a Library that can be ordered

Date: 2026-09-21 · Status: approved

Five changes that share no code but share a habit: each one takes a thing the app already has and stops it
contradicting itself. The bottom bar and the select toolbar stop fighting over one place. The flashcard stops
insisting that the only way to answer is a throw. The deck header stops being a dead end. The Library stops
being orderable only by hand. A card style stops being something you can only give to one deck at a time.

Sits beside `2026-09-21-sync-cadence-extension-features-and-study-chrome-design.md`, which this one leans on once:
decks are a **held** table, so a bulk style write is reported as waiting until Synchronise.

## 1. Why

- **Two bars want the same edge.** Starting a selection in the Library calls `useHideAppNav(true)`, which flips
  `AppNav`'s `showNav` to false. Its `useLayoutEffect` cleanup then removes `--app-bottom-inset` **in the same
  frame**, while `AnimatePresence` is still playing the nav's 240 ms exit. `SelectToolbarDock` pads itself by that
  inset, so it drops to the bottom edge and sits underneath a nav that has not left. Worse, `SelectToolbar` has no
  enter or exit animation at all — it simply appears. Two bars, one edge, and a layout jump between them.
- **A flashcard can only be answered by throwing it.** Every answer is a fling: `useCardSwipe` reads a drag and
  resolves it to one of four directions. A learner who cannot or would rather not throw a card has no way to grade
  one. And because a tap anywhere flips, a card that is showing its answer is one stray touch away from hiding it.
- **The deck header is a dead end.** `ScreenHeader` prints `deck.name` as text. Moving from a deck to its subdeck
  means going back to the Library, finding the parent, opening the row, and coming back in.
- **The Library has exactly one order.** Decks sort by `order`, which only a drag writes. Cards have had
  `contentSort` for a while — manual, recent, name, due, flagged — and decks never got the same.
- **A card style reaches one deck.** `DeckSettings.cardStyle` is deliberately not in `MAIN_DECK_SETTINGS`, so every
  subdeck owns its own. Giving a subtree one look means opening each deck and repeating yourself.

## 2. Decisions

| Question                                          | Decision                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| How do the nav and the select toolbar trade places? | They do not trade places. They are the **same box** — `h-16 w-64`, centred, on the safe-area bottom — and one fades out as the other fades in. |
| Who owns `--app-bottom-inset`?                    | The shared dock, by refcount. Both occupants are mounted mid-crossfade; the inset must survive the handover.                          |
| Does the pill shell reach every select surface?   | Yes. Library, deck questions and the deck content editor all use it. One shell, one geometry.                                        |
| What is in a toolbar slot?                        | Icon over a `text-tiny` label, like a nav tab. Four slots of 51 px; exit stays the corner `CloseBadge`.                               |
| What replaces a swipe?                            | Four **edge strips**, one per direction, firing the actions those directions are already configured with. The centre stays the face.  |
| What makes tap zones safe in every display mode?  | Nothing new: the tap pipeline already yields to controls, and every mode's interactive part is a control.                             |
| Where is flip, once a tap may mean an answer?     | A button in the card's **top-left** corner, on both faces, in both input modes. The centre still flips.                              |
| Is a flipped card sticky?                         | It already was. `study-session-machine` resets `flipped` only on advance. Nothing to add.                                             |
| What does the deck header list?                   | The subdecks of the deck you are in, then **More decks…**, which is the move drawer with different words.                             |
| Does switching decks stack history?               | No. `replace: true`, so Back still means "out of the deck".                                                                           |
| How do decks sort?                                | One order — Manual, Name, Recent, Due — plus an **Include subdecks** toggle, on by default.                                           |
| What does a drag do while a sort is on?           | The same as it does for cards: it drops the order back to Manual. A drag still only reorders (ADR 0001).                              |
| How does a style reach many decks?                | It is **copied** onto each. No inheritance, no new fallback, no schema change to `DeckSettings`.                                      |
| Where is it reached from?                         | Both: an **Apply to…** scope picker on the card style page, and a `style` action in the select toolbar.                               |
| What stops a bulk apply flooding the pending log? | Decks whose style already matches are skipped.                                                                                       |

## 3. One bottom slot

### 3.1 The dock

`shared/ui/BottomDock.tsx` is the geometry, and the only thing that knows it:

```
fixed inset-x-0 bottom-(--p-safe-bottom) z-(--z-nav) mx-auto h-16 w-64
in-data-keyboard:hidden
```

It claims `claimBottomChrome` for the `--bottom-chrome` measurement that already exists, and it owns
`--app-bottom-inset` — `calc(var(--p-safe-bottom) + 4rem)` — by **refcount**, because during the crossfade two
docks are mounted and the one that unmounts second must not clear an inset the other still needs. The refcount is
`claimBottomInset` in `shared/lib/bottom-dock.ts`, claimed by the box that is on screen — a box still playing its
exit keeps holding the slot open until it has actually gone.

That single move is what removes the jump. The nav and the toolbar are the same height, so the inset never
changes while they swap, so the list beneath them never moves.

### 3.2 The two occupants

`AppNav` keeps its pill — the blur, the gradient, the `layoutId` pill behind the active tab — and gives up its own
positioning and its own `useLayoutEffect`. Its exit becomes **opacity only**: no `y`, no `scale`. A pill that
shrinks and drops while another bar fades up in the same rectangle reads as two objects; a pure crossfade reads as
one bar changing its mind.

`SelectToolbar` adopts that same shell: `rounded-nav`, the same two glass layers, `justify-around`, and four slots
of `flex-1` holding a `size-5` icon over a `text-tiny` label. After `px-4` the inner width is 224 px, so with
`gap-1.5` each of four slots is 51 px — enough for the longest configurable label. `SELECT_TOOLBAR_MAX` stays 4.
`CloseBadge corner="start"` still rides the pill's corner.

`SelectToolbarDock` goes: it would only have forwarded to `BottomDock`. The three pages render `BottomDock`
directly and hand it `open` rather than rendering it conditionally — a component that is torn out of the tree
cannot animate out. They change from `{active ? <Dock>…</Dock> : null}` to `<BottomDock open={active}>…</BottomDock>`.
`DockPill` is the shared surface — glow, glass, rounding — and lives in its own file.

Both animations are 0.2 s; under `prefers-reduced-motion` both are 0.

## 4. Answering by tap

### 4.1 The setting

`preferences.flashcardInput: 'swipe' | 'tap'`, default `'swipe'`. It says how an answer is **given**, never what
the answers are: the four directions keep the actions `flashcardSwipe` already holds, per algorithm and per
display mode. The gear sheet that configures them gains one toggle, **Answer by tapping**, and names each direction
for how it is given — "Swipe left" becomes "Tap the left" — so the same four rows configure both.

Schema 5 → 6, with `resolveFlashcardInput` as the read-side twin in `makePreferences`, because replication writes
pulled rows unmigrated.

### 4.2 The strips

`useCardSwipe` takes `input`. In `tap` mode the card no longer tracks the pointer and no throw is resolved; the
`frame === 'tap'` branch, which today calls `onFlip`, resolves the tap's point to a zone instead.

`widgets/study-session/model/tap-zones.ts` is pure and tested:

```ts
zoneFor(point: Point, rect: Rect, strip: number): SwipeDirection | 'centre'
```

A strip is 18 % of the card's shorter edge, floored at 44 px and clamped so the centre keeps at least half of each
axis. Corners belong to whichever strip is nearer.

What makes this safe in every display mode is that nothing about it is mode-aware. The existing `isControl` test
runs first and wins, and every interactive part of every face **is** a control — the blurred words in `BlurFace`,
the tokens in `InitialsFace` and `RebuildFace`, the input in `TypeFace`, every `AidButton`, the speak button, the
mode button, the gear. A strip only ever receives a tap that reached the card's background.

### 4.3 What the learner can see

`DirectionChip` is driven by the drag's `x`, so in tap mode the chips never appear and a strip would be invisible.
In tap mode the four chips render instead as static, low-opacity hints pinned to their edges. They are the only
thing that says what a strip does.

### 4.4 Flip

`CardFace`'s header goes `justify-between` and gains a flip button in the **top-left**, on both faces, in both
input modes — so flipping back off a crowded `BlurFace` is one reliable target rather than a hunt for background.
The centre of the card still flips.

Nothing is needed for "the card stays flipped": `study-session-machine` already resets `flipped` only when the
queue advances, and the next card therefore always opens prompt-side up.

## 5. The deck switcher

`DeckSwitcher`, in `widgets/deck-tree`, is passed as `ScreenHeader`'s `title` — which is already a `ReactNode`, so
`shared/ui` does not change. It prints the deck's name with a chevron and opens a sheet listing
`childDecks(decks, deck.id)` that are not archived, then **More decks…**.

More decks… is `DestinationSheet` with `targets='deck'`, no `excludeIds`, and an `action` of
`{ prompt: 'Pick a deck to open', confirm: (name) => 'Open …' }` — the same drawer as a move, wearing different
words, which is the whole point of that component taking an `action`.

Switching navigates with `replace: true`, and the screen is keyed on `deckId` so the search field and the
selection — both of which belonged to the deck you left — reset with it.

## 6. The Library's order

`shared/lib/deck-order.ts`, pure and tested:

```ts
export const DECK_SORTS = ['manual', 'name', 'recent', 'due'] as const
sortDecks<T>(decks: readonly T[], sort: DeckSort, dueCount: (deck: T) => number): T[]
```

`manual` returns the input untouched, so the existing `order` remains the only thing a drag writes.

Two preferences, in the same schema bump as §4.1: `deckSort` (default `'manual'`) and `deckSortSubdecks`
(default **`true`**). `use-library-data` applies the order to `sectionDecks` and — when the toggle is on — passes
a comparator into `flattenDecks` so every nested row sorts too. Folders follow the order where it makes sense for
a shelf — `name` and `recent` (`FOLDER_SORTS`) — and keep their dragged order under `due`, since a folder has no
due date of its own.

The control is the `SortControl` the content editor already uses, above the rows, with the toggle beside it once
an order is chosen — under Manual there is nothing for it to reach.

A drag sets `deckSort` back to `'manual'` before it reorders, exactly as `DeckContentEditor` already does for
cards. ADR 0001 is untouched: a drag still only reorders, and every reachable row is still a peer.

## 7. Applying a card style

### 7.1 The form

The controls in `DeckCardStylePage` — preset strip, font sheet, size stepper, alignment — move into
`widgets/card-style-form`, the same split `widgets/appearance-form` already is. Both entry points then compose and
apply the same whole `CardStyle`, rather than one of them applying a preset and the other everything.

### 7.2 The command

`features/deck/apply-card-style.ts`:

```ts
type StyleScope =
  | { kind: 'deck'; deckId: string }
  | { kind: 'subtree'; deckId: string }
  | { kind: 'all' }
  | { kind: 'ids'; ids: readonly string[] }

applyCardStyle(store: DeckStore, style: CardStyle, scope: StyleScope): Promise<number>
```

`subtree` resolves through `subtreeDeckIds`; `all` is every deck that is not archived — the archive is a place
outside the Library (ADR 0003), and a style is given to what is on the shelves. Decks whose stored style already
equals the one being applied are skipped — `sameCardStyle` exists — so the count it returns is the number of decks
that actually changed, and the pending change log only grows by that much. `cardStyleTargets` is the pure half, so
a screen can count before it asks.

### 7.3 The two doors

The card style page gains **Apply to…** in the footer beside Save — always there, since a saved style is as
worth spreading as an edited one: this deck, this deck and its subdecks, or every deck. The last one confirms,
naming the count. A rejected write says so in a toast on both doors.

The Library select toolbar gains a `style` action — a seventh candidate for four configurable slots, not one of
the three defaults. It opens the form seeded from the first selected deck's style and applies to
`{ kind: 'ids' }`.

**The cost, stated plainly:** a copy is one write per deck. Applying to a hundred decks puts a hundred changes in
the pending log, and decks are a held table, so the banner reports them until Synchronise. The skip-if-identical
rule is what keeps that number honest rather than theatrical.

## 8. What is tested

- `tap-zones` — every direction, the centre, corners, the 44 px floor, a card too small to hold four strips.
- `deck-order` — each order, stability, `manual` returning the input untouched.
- `apply-card-style` — each scope, the skip-if-identical count, a subtree that includes its root.
- `AppNav` — the inset survives the swap (today's test asserts that it is cleared; that assertion changes).
- `SelectToolbar` — four slots fit, the close badge exits selection.
- `DeckSwitcher` — lists only non-archived children, More opens the drawer, switching replaces the route.
- The Library — choosing an order reorders the rows; dragging a row sets the order back to Manual.

## 9. What is deliberately not here

- No inheritance for `cardStyle`, and no app-wide default style. A copy is what was asked for, and it leaves every
  deck's own control working.
- No per-folder or per-deck remembered order. One order, one toggle.
- No second configuration surface for tap actions. A direction's action is a direction's action, however it is
  given.
