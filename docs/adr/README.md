# Decision records

One record per area, each the decision as it stands now, its History naming what it replaced. A change to an area
amends its record; a new record is for a new area. Each keeps the number of an earlier record of its area, so an old
citation still leads to the right one (`git log -- docs/adr` reads the old records). What was built and fixed under
each is in [HISTORY](../HISTORY.md).

| ADR                                           | Title                                          | Decides                                              |
| --------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| [0001](0001-drag-and-drop-and-card-stacks.md) | A drag only reorders; real cards in a stack    | drag, the drag engines, card stacks                  |
| [0002](0002-the-shell-and-the-keyboard.md)    | The shell is anchored; the keyboard covers it  | the viewport, the keyboard, bottom chrome, dev probe |
| [0003](0003-the-library.md)                   | The Library                                    | the archive, placement, orders, filters, offering    |
| [0004](0004-what-needs-the-network.md)        | What needs the network, and the account's life | offline gates, sign-out, account deletion            |
| [0005](0005-sync.md)                          | Sync                                           | the cycle, cadences, divergence, first Sync, merging |
| [0007](0007-the-status-bar.md)                | The status bar                                 | the bar's style and colour, `.chrome`, the top inset |
| [0008](0008-deck-settings.md)                 | Deck settings                                  | main-deck settings, card style copies, stored-only   |
| [0009](0009-extensions.md)                    | Extensions                                     | the extension layer, features, the Bible's corpus    |
| [0010](0010-large-decks.md)                   | Large decks                                    | entity identity, windowed lists                      |
