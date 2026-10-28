# What the owner has asked for, by area

The owner's feedback from every session, condensed and grouped by area. Read the section for an area before changing it. A point here was either built or is still open; check the code, the ADRs and `docs/HISTORY.md` before assuming which. Quotes are the owner's own words, typos fixed.

## Contents

- Library: folders, decks and subdecks
- Library: select mode, sort and filter
- Drag, reorder and stacks
- Move, archive and delete
- Deck page, card preview and card actions
- Swipe actions and the toolbar editors
- Flashcards: answering and the study screen
- Study modes: blur, type initials, type words, rebuild
- Fast review, XP and the end of a session
- Deck settings and algorithms
- Card styles
- Header, search, status bar and splash
- Sheets, drawers, keyboard and scroll
- Bottom nav, select toolbar and footers
- Surfaces, shadows and padding
- Profile and progress
- Sync, offline and the account
- Extensions and Bible
- Planned
- Process

## Library: folders, decks and subdecks

- **Saved state:** open subdecks and other view state survive closing the app.
- **Deleting a folder** deletes every deck it contains.
- **Moving a deck out of a folder** keeps its subdecks as subdecks. They must never turn into top-level decks.
- **Missing decks:** a deck that exists but shows nowhere is a bug ("why my 1 Corinteni doesn't appear in the library", though import said its verses were already there, with the filter on All decks).
- **Deck switcher:** a dropdown merged with the deck name in the deck header, to jump between a deck and its subdecks. "More" opens the same kind of sheet as Move, but it only switches the deck that is open.

## Library: select mode, sort and filter

- **Where:** sort and filter are edited only in select mode, and what was set there stays set after select mode ends.
- **Sorts:** decks and subdecks can be sorted. A subdeck level can have its own order.
- **Filters:** favourites, due, and other useful filters.
- **Offer only what applies:** "if there are no subdecks then no All subdecks button", no Bible book filter when no deck is in that book. Never show an unavailable sort or filter option.
- **One order everywhere:** "make one implementation of the order that is used across the app". The Move sheet honours the Library's sort, filter and group headings.
- **Selecting a deck** also selects its subdecks. Selecting only some subdecks puts the parent's checkbox in the third (mixed) state.
- **Selecting cards** in a deck works like the Library, with one unified header (Select all, Cancel).
- **The select toolbar** is customizable and has more features.

## Drag, reorder and stacks

- **Drag only reorders.** "Now drag and drop will only be for reorder". Making a deck a subdeck goes through the Move sheet.
  - **Removed:** dropping a deck on a deck to make it a subdeck. The owner asked for it first, then reversed it.
- **No flicker** when reordering decks or toolbar actions. Write the fix down so it stays fixed.
- **No shrinking:** a selected deck, folder or subdeck keeps its width while dragged. Only hovering over a drop target animates.
- **Multi-drag:** selected items lift and drop together as a stack of the real items, never stubs. The last selected is on top. On release the count badge goes at once and the items settle from behind the stack.
- **Lifted items** in any reorder are elevated and wear the ✕ badge in the corner.

## Move, archive and delete

- **Duplicate and Archive** ask for confirmation first. After archiving, the app leaves the archived deck and goes home.
- **Move sheet:** the selected row's tint keeps clear of the + glyph.

## Deck page, card preview and card actions

- **Carousel:** a preview carousel between Previous and Next, "like in Photos app". Edit moves to the header, next to the menu button.
- **The preview stack:** real cards, with their buttons and labels, render behind the top card, and the next comes from behind it. Swiping back shows the previous card behind. No flicker.
- **Going back:** a card opens on its front, never its back.
- **Card actions:** every card-menu action is also a swipe action. Add useful ones, such as setting the grade by hand and studying from this card. The whole list must be reachable (Learning history was once cut off the sheet).
- **Study from this card** runs on in deck order: "I open card 14 and after that I will have card 15", not card 1.
- **Search cards** has padding from the header bar.
- **Questions page:** with no questions, every option is on the page without a dialog. Export lives only in the questions settings.

## Swipe actions and the toolbar editors

- **Settings UI:** "this tab is not a very good UI choice". The left and right actions were duplicated too much. Find a better way to manage them.
- **Live editor:** one wrapping row of all actions, reordered by drag on the toolbar itself. A new action joins at the end on the right.
- **Reliable swipes:** swiping a second row releases the first cleanly, with no flicker. One implementation, app-wide.
- **Every rail action works.** The right-hand actions on deck-page rows once did nothing.

## Flashcards: answering and the study screen

- **Tap instead of swipe:** a setting replaces swipes with taps on the left or right. Once flipped, the card stays flipped until the learner flips it back.
- **The middle:** no zone labels on the card and no default tap-to-flip in the middle. The middle tap is customizable. It flips the front only.
- **Swipe grades per algorithm:** spaced repetition and Fast review have separate swipe actions, shown only in their mode, so nothing is misleading or silently ignored.
- **Only the content scrolls:** the card has a fixed height and long text scrolls inside it, "like a real page", between its header and footer. The page never scrolls and the grade bar is never pushed off screen (the card editor too).
- **The study chrome:** the bottom bar blends into the card style's background, with buttons floating over it. "Tap to answer" is a real tappable button.
- **Study settings sheet:** no Finish button (or it only closes the sheet). General settings go to the header, mode settings stay on the card. Initials sits above rebuild.
- **Saved preferences:** every study-mode preference persists, including the type initials and type words choice.

## Study modes: blur, type initials, type words, rebuild

- **Start state:** type and rebuild always start on the card's face, whatever state the previous mode left.
- **Solved stays solved:** a rebuilt card can't flip again. Only Reset resets it, and the "solved, tap to see the answer" overlay goes. Same for type initials.
- **Blur:** the Blur and Show all buttons are the same size.
- **Type initials:**
  - The wrong-letter popup sits below the text box and shows only while focused. Wrong letters in a row replace each other smoothly, without flicker.
  - Finishing is visible to the learner.
  - Reopening the keyboard keeps the scroll where it was, so the front title doesn't scroll away.
  - A dash stays one dash ("I get two dashes there").
- **Type words:**
  - Wrong words are judged correctly, including a correct word after a wrong one, and extra words still get feedback.
  - The feedback box is a persistent popup above the keyboard: fixed height, min and max width, its own scrollbar. It goes back inline when the keyboard closes. Scrolling it never swipes the card.
  - A finished card keeps the typed text and the feedback.

## Fast review, XP and the end of a session

- **Fast review works and saves** ("seems to not work at all").
- **XP on leaving:** closing mid-session still pays XP for what was done. Learned cards stay learned.
- **Completion screen:** improve it to match the app, and account for the status bar while it shows.

## Deck settings and algorithms

- **The model:** rebuild deck, flashcard and algorithm settings from the owner's screenshots of another flashcard app, with every feature except AI, publishing, sharing, reporting and offline cards. UI first, backend later.
- **Two algorithms:** Fast review and spaced repetition, chosen in a sheet, each with its own deck page and card look.
- **One entry:** the algorithm line on the deck page is one button that opens the change-algorithm sheet. No second info sheet beside it.
- **Buttons:** the algorithm buttons must not blend into the background. They wear the same outlines and colours as other buttons.
- **Subdecks:** the algorithm can't be changed on a subdeck. The control is disabled and a message says why.
- **Import** in deck settings works.

## Card styles

- **No transparent card.** A face behind must never show through. Check every style.
- **Quality:** better graphics and typography. Remove sharp borders. The owner disliked the second style and sent more styles to add.
- **Dark mode:** every style has a dark version.
- **Scenes:** a style also changes the study screen's background and chrome. The header and status bar follow it, like the study footer does.
- **The picker:** each option renders the real card on its own background. The option's fill reaches its top edge. The carousel has a left inset like the others.
- **The page:** a pinned card preview over scrolling controls; once something changes, a pinned Apply bar joins as a third part. The preview scrolls its text inside fixed borders. A full-screen preview button sits next to Reset.
- **Bulk:** apply a style to all decks and subdecks, across the app or across one deck.
- **Same header height** as other pages. If a progress bar is needed, it floats.

## Header, search, status bar and splash

- **One header** with a fixed height and the same button sizes on every page.
- **Search in the header:** it expands in place and hides the other controls; closing gives the header back. Padding from the edge and the ✕ leaves room for the focus ring. The reveal never looks cut.
- **Status bar:** always the header's colour, in light and dark (the owner sent examples of a merged bar and header). It dims with the page under a sheet's blur, matches the splash, and never turns white when a toast passes near it.
- **Splash:** nothing shows behind it in dark mode, and no toast or focused field before it ends.

## Sheets, drawers, keyboard and scroll

- **Lift the sheet, not the app:** "I only want the sheets to be elevated and not the whole app", for every control that opens the keyboard, with no gap between sheet and keyboard.
  - Tapping selected text in a drawer field must not lift the whole app.
- **Prefilled fields** open with their text selected.
- **Smaller chrome:** smaller drawer headers and footers, for more content room.
- **No needless scroll:** a page that fits doesn't scroll, and nothing scrolls too far above the keyboard.
- **Form accessory bar:** remove it (the owner named Capacitor for this).

## Bottom nav, select toolbar and footers

- **Main pages only:** the bottom nav shows on Home and Profile, not inside folders or decks.
- **Select mode:** the nav hides and the select toolbar takes its place, either in the same spot with a good fade, or after the nav leaves. It never sits above the nav. The nav never flashes transparent on the way back.
- **Toolbar look:** buttons are easy to read and see, with smooth transitions to the nav and back.
- **The ✕** in select mode sits in the corner of the main frame, not on the left of the bar.
- **Footers** stay put with no keyboard while the page scrolls above them, and join the scroll only while the keyboard is up. No first-paint flicker (the import page).

## Surfaces, shadows and padding

- **Edges:** controls must not blend into the background. Style them like the sync bar.
- **Shadows** on folders, decks, swipe actions and select mode render correctly.
- **Padding for every state:** "all the controls and UI should have proper padding for all styles and animations".

## Profile and progress

- **Buttons look like buttons:** the day-streak button reads as a button and still blends in.
- **Progress bars** don't replay on every page change; animate only where it means something, such as badges.

## Sync, offline and the account

- **What needs the network:** disable only actions that need the server now, such as a password change. Deleting a folder offline is local and syncs later.
- **What syncs by hand:** only card work waits for Sync, and Autosync is about it. Preferences such as Library appearance and open decks sync by themselves. The UI explains this.
- **Errors:** "the fetch was aborted" and JWT errors need a clear message and a reliable recovery.

## Extensions and Bible

- **Extensions:** decoupled from the app, switched on and off in Settings. Switching one off disables its UI and backend but never loses progress.
- **Overview page:** "show what kind of extension this is and all the features it provides", and manage them there. The old screen is the developer settings and is named so.
- **Import:** book, chapter, then a verse or a range, into an editable text box. "Include in decks" picks existing or new decks. A card is a verse, a subdeck a chapter, a deck a book.
- **Shared verses:** books added on one account are available to every account and every device.
- **Publishing:** adding verses to the cloud Bible library is developer-only, in developer settings.
- **Sorts and filters:** biblical order with Old and New Testament headings, and by kind of book (minor prophets, major prophets and so on).
- **Duplicates message:** "already in your library" is formatted well, not a wall of references.
- **Later:** a reading tracker with plans, a memorization overview with Bible badges in the profile, and a Bible tab in the bottom nav for reading, selecting and adding verses.

## Planned

- **Reading mode:** a fifth study mode with less XP, back and next gestures, a carousel in the bottom bar and a header button that switches to grades. The card looks like the back, with the front small above it.
- **Release:** hide admin and developer tools from normal users, versioned releases, automatic tags, conventional commits, a short README, and rollouts to user groups an admin manages.
- **More:** Romanian and German, bug reporting, onboarding, a customizable guest account, palace journeys and loci, goals and habits, an AI tutor that asks before each action (parked).

## Process

- **Read past the typos:** the owner writes fast; the screenshots are the spec. Describe a screenshot's content in words when passing it on.
- **Consult first:** for a redesign the owner proposed, they ask "consult me on this if it is a good proposal". Grill or check before building.
- **Root causes, app-wide:** fix the cause once, with no duplicate implementations, and check every place the bug can occur.
- **Document every fix class** in CODE_STYLE, CLAUDE.md or an ADR.
- **Verify, don't claim:** "your changes are not working reliably or not working at all" came after unverified claims. Check on the viewport probe and say what wasn't tried on a device.
- **Explain plainly:** the owner asks what report jargon means. Use plain words.
- **Concise answers:** "Be extremely concise. Sacrifice grammar for the sake of concision", at the top of CLAUDE.md.
- **Audits:** an audit fixes nothing. Each finding names file and line, trigger and wrong outcome; the owner picks the fixes.
