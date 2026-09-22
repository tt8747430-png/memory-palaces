# Offer only what applies

Date: 2026-09-22

Two changes, one idea. The app offers a learner a fixed catalogue: every sort, every filter, every action, whether or not
it can do anything here. Twelve Bible book filters sit in the Library's Show menu on a device with no Bible decks; "All
subdecks" offers to reach subdecks that do not exist; Reset offers to unschedule a card that was never scheduled. And
the screen where a learner arranges those actions manages them through a mode that is invisible until you tap something.

## The rule

**An option is offered when it can change what the learner sees — plus always when it is the one currently applied.**

Two corollaries keep it from jittering:

- **Omit** when the screen or the row cannot offer it: no subdeck exists, this card was never reviewed, no deck here
  falls in the canon.
- **Disable** when the learner is one tap from making it apply: nothing is selected yet in the select toolbar. Toolbar
  availability therefore reads the **screen**, never the selection — ticking a checkbox never adds or removes a slot.

An applied option is always offered even at zero, so the learner can see what they asked for and change it. The list
falls to the empty notice that already exists (`deck.filterEmpty`).

### Extensions are not asked for anything new

Availability falls out of the pure functions a contribution already declares:

- a filter is available when `decks.some(filter.keep)`
- an order is available when `decks.some((d) => order.rank(d) !== null)`

`DeckFilterContribution` and `DeckSortContribution` are untouched. The Bible extension gains adaptive filters without a
line of its own changing — which is the test of whether the seam was in the right place.

## Part A — the surfaces

### A1. Library arrange bar

`LibrarySelectBar` renders only while a selection is on, so the availability work — including the due counts it needs —
is paid only there. New hook `pages/deck-library/model/use-arrange-options.ts`, gated on `enabled`. Predicates read the
rows **at the level being looked at** (`unfiltered`), not the whole library: the bar arranges this level.

| Option                            | Offered when                          |
| --------------------------------- | ------------------------------------- |
| the Sort control itself           | 2 or more rows                        |
| `manual` · `name` · `recent`      | always                                |
| `due` (order)                     | some row has a due card               |
| `bible:canon` · `bible:genre`     | some row is placed in the canon       |
| the Filter control itself         | something beyond `all` is offered     |
| `favorites`                       | some row is a favourite               |
| `due` (filter)                    | some row has a due card               |
| the 12 book filters               | some row falls in that testament/genre |
| the All-subdecks chip             | some deck here has a live subdeck     |

The pure half lives in `shared/lib/deck-order.ts` beside `resolveDeckOrder`, which is where a caller already goes to ask
what an order is. The hook is tested through `renderHook`; the predicates are tested without React.

**One fix this forces.** `SortControlOption.dividerBefore` is positional — `at === 0` on the contributed list — so
filtering the options can orphan the separator onto a removed row or lose it entirely. It becomes `group?: string`, and
`SortControl` draws a separator wherever the group changes. Declarative and order-independent, so any later filtering is
safe by construction.

### A2. Cards

- Sorts: `due` only on a spaced deck that has at least one scheduled card; `flagged` only when some card is flagged.
- Filter sheet: a maturity chip only at count > 0; the Flagged switch only when some card is flagged. **Nothing left to
  offer means the Filter button itself goes.**

Pure `cardFilterOptions(cards)` in `widgets/content-editor/model/card-list.ts`, tested there.

### A3. Actions, rails included

Handlers are omitted, which `buildSwipeActions`, `buildMenuActions` and `SelectToolbar` all already honour — a missing
handler drops the action from every surface. `sortSubdecks` has worked this way since the subdeck sort landed; this
extends the same mechanism rather than adding one.

Per card, in `cardActionHandlers`:

| Action    | Omitted when                                                        |
| --------- | ------------------------------------------------------------------- |
| `reset`   | there is nothing to clear: no schedule, no Fast outcome, no history |
| `history` | the card has no history entries                                     |
| `move`    | there is nowhere to move it (fewer than 2 decks)                    |

`reset` reads all three because `resetCardsSrs` clears all three at once — `srs`, `fastReview` and the entries behind
them — so any one of them present is work for it to do.

**`known` was on that list and came off it.** Marking a card known is `markKnown(srs, now)`, which raises `reps` to at
least four and pushes the due date out again; on a card that already reads as known it re-masters and re-schedules
rather than doing nothing. It can change what the learner sees, so by this spec's own rule it stays offered.

Per deck: `move` only when another deck or folder exists to receive it; `sortSubdecks` as today. Toggles (`flag`,
`freeze`, `reverse`) and `grade` stay always-offered — they relabel rather than vanish, so a rail carrying one never
comes up empty.

This supersedes the note in `card-actions.ts` that every action but Select and Study is offered on every card. The
reason it gave — a configured rail must not come up empty — is answered differently now: a rail drops the slot, and the
caps after it close the gap. The mis-tap that invites is already softened, because `delete` on a card and on a deck both
route through the confirm dialog (`pending.request`), so a mistaken cap asks before it destroys anything.

Select toolbars keep `disabled` for selection-emptiness, per the corollary above.

## Part B — the two settings screens

The kind tabs stay. What goes is the way actions reach a rail: today a second `SegmentedControl` sets an "Add to" target,
and tapping a palette pill means "add to whichever side that control is pointing at" — a mode with no visible subject.

**The rails become the control.** New `shared/ui/ActionSlots.tsx`: one strip of slots, filled ones in the action's own
accent, empty ones a `+`. Drag to reorder, the close badge to remove, `+` to open an `ActionSheet` of the actions still
available for this kind. Nothing about a strip knows which screen it is on, so both screens render the same one:

- **Swipe actions** — two strips under an inert sample row: Swipe right (2 slots), Swipe left (4).
- **Select toolbar** — one strip (4 slots) under the live `SelectToolbarRow` preview it already shows.

**Dragging a cap from one rail to the other goes.** The old preview was a two-container `DndContext`; a strip now owns
its own, and reorders only within itself. Moving an action across is taking it off and adding it on the other side —
two deliberate taps. That is a gesture lost, and two things bought: the picker never silently empties the side the
learner was not looking at (the old palette's `withoutSwipeAction`-then-add did exactly that), and the cross-container
`onDragOver` bookkeeping that ADR 0001 and CODE_STYLE §10 warn about is gone. The picker offers only actions on
*neither* rail, so a pick can never move something.

Retired, with their tests: `pages/settings-swipe/ui/ActionPalette.tsx`, `pages/settings-select/ui/ToolbarEditor.tsx`,
`shared/ui/ActionPill.tsx` (no other caller) and `pages/settings-swipe/ui/swipe-accent.ts`, which had become a bare
re-export of `accentStyleOf`. `SlotCount` moves out of `ActionPill.tsx` into a file of its own — it was a second
exported component in there, against CODE_STYLE §1 — and off the `shared/ui` barrel, since the strip is its only
reader. `CLOSE_BADGE_ROW_GAP` keeps its one caller: the gap between slots is the badge's overhang, not decoration.

Dead keys go with them: `swipe.addTo`, `swipe.paletteHint`, `swipe.sideFull`, `select.available`, `select.allInUse`,
`select.full`.

## What is not in scope

No RxDB schema changes, so no migration and no read-side twin. `SwipeConfig`, `SelectToolbarConfig` and the preference
documents are untouched; `normalizeSwipeConfig` and `normalizeSelectToolbar` already drop an id the build no longer
knows, which is the only back-compat this needs.

## Testing

- Pure: the new `deck-order` predicates, `cardFilterOptions`, `cardActionHandlers` availability — no React.
- Hooks: `use-arrange-options` through `renderHook` over in-memory stores.
- Components: `SortControl` draws one separator per group change; `LibrarySelectBar` hides what nothing matches and
  keeps the applied filter listed at zero; `ActionSlots` adds, removes and reorders.
- Regression: `npm run typecheck && npm run lint && npm run test`, then `npm run build && npm run check:entry-graph`
  because barrels and page imports move.
