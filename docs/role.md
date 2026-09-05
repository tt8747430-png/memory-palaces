# Problems

"Be extremly consisse. Sacrifise grammar for the sake of consision." - Put this on top of the CLAUDE.md and document
   it everywhere you can.

GENERAL:


REFACTORINGS:

SETTINGS:use 

1. review the pages structures and theme.css and other appscreen structure and look for overlapping structures colliding, things that are not used, outdated, broken, wrong, look at the events que and so on.  find broken styles broken tailwind that doesnt work, find all insconsistencies, use /superpowers and other bug finding skills and other best practices and skills 





1. when deleting a folder it also must delete all that it constains 
2. when i move the deck out of the folder al of its' subdecks become decks alongside with the main deck bug



7. in the home page the decks and folder  are not correctly elevated above the speed dial horizontal line like,  e.g. the bottom nav is 50px above the screen edge and the dial is 100 px above the screen edge and it has 15px height, the decks should be elevated above at the e.g. 120 px with space between decks and speed dial. 

8. also in the flashcards study page when a page has to many words and the scrollbar appears the focus of the scrollbar when i want to scroll is trapped by the swipe actions although in the area of the scrollbar the actions should not trap the focus from the scrollbar



2. improve the paste notes add bible prefill and better admin mode, and the edit cards sheet, 
3. add posibility to submit bugs 



- Scope creep (b) — AppScreen's pinned/ScreenGutter API across 6 screens, AlgorithmCard, theme.css's reindent, role.md's reorg. Shipped and working; reverting is a bigger change than the finding. They were unmentioned in the commit bodies, not wrong.
- card-style.ts divergent change — down to one concern (printed materials + the vars that paint them) now the chrome tables are gone; splitting further would fragment a cohesive 285-line module.
- MoveSheet still offers "Archive" to an archived deck. It also offers "Home" to a deck already at home — same no-op, now documented rather than special-cased.

FEATURES:

1. Extenstions Gallery: Memory Palaces, Bible 
1. Journey in palaces locies 
2. Journey stations editing and connecting
3. Add the actual palace locations and real palace image

OTHER: 
8. we dont have onboarding and guest account lacks customizability
1.  Appheader should be a component and all the components should be maybe just a implementation of the content inside of this header and not reimplement the whole template and shell, just the content inside the header like the buttons and so on .this should be across all the app















fixed:

SELECTMODE:

1. the select mode toolbar should also be customizable and have more features.

ANIMATIONS:

2. the select mode doesnt correctly elevate the controls. they should be elevated as they are also with the select
   checbox and so on. and i want also to be able to drag and drop a real deck onto a real deck and this deck will become
   its subdeck and so on. also the decks reordering is flickerring animatinons. fix this bug
5. bug: the progressbars are reloaded animation anytime i change the page and this is anoying. this should maybe only be
   when suitable e.g. in the badges progress animtations and so on
6. add to claude fix of the drag animation flickering and fix after that the flickering in the toolbar actions reorder
   settings

FLASHCARDS:

3. the type and rebuild flashcard modes should start in the initial state and no in the flipped state e.g. if i change
   the mode from the blur flipped mode. and also when the flashcards was solved in the rebuilt mode it shouldnt be
   flippable again and only the reset button will reset the flip action and other actions. and after it is rebuild the
   overview -solved tap to see the answer also will be removed. and the same with the type initials mode. and the type
   words flashcard mode also should be somehow refactored to improve the user interactions. conslut me on these issue if
   it is a good proposal
4. inside a feedback text box control in the type flashcard mode i cant fully and reliable scroll whne the content is
   too high and it triggers the flashcard swipe mode. and also the page shouldnt be scrollable in none of the modes and
   only the contents between the flashcard headers and flashcard footers should be scrollabel like a real page when it
   is needed and there is too much text, therefore it should be flexible and adaptable to all types of contents

/impeccable /grill-with-docs
your changes from the flashcard modes and scroll design spec are not working reliable or not working at all

1. the type words mode doesnt correctly evaluate wrong words and maybe when a word is wrong and the word after that is
   correct it should also show a apropriate feedback. this is photo '/Users/kristianbraila/Desktop/Screenshot 2026-07-14
   at 00.43.33.png'

5. in the blur flashcards mode the buttons blur and show all must be the same size or so
   /Users/kristianbraila/Downloads/IMG_2606.PNG
6. the rebuild mode and the type mode always should start in the flashcard face mode igroring in which state back or
   front it was before we switched to this mode

3. we still have the bug that the controls are not correctly elevated or the sheets are not correctly elevated when the
   user open the keyboard. see here /Users/kristianbraila/Downloads/IMG_2610.PNG
   /Users/kristianbraila/Downloads/IMG_2621.PNG /Users/kristianbraila/Downloads/IMG_2622.PNG
   i only want the sheets to be elevated and not the whole app and event when i scroll bar to the top, the sheet looks
   awful with these transparent space between the sheet and the keyboard toolbar, this should not be like this.

you said also:
On-device check for #5: desktop browsers don't fire soft-keyboard visualViewport events, so I verified the logic +
types/lint/tests but couldn't exercise the actual keyboard here. Worth a quick pass on a real phone (create-deck sheet,
the type-answer study mode, and the card/question editors).
The design hook flagged the height transition on .kb-fit as a layout-animation. I left it intentionally: shrinking the
shell by the keyboard's height is the correct model (it's what native resizes-content did), it only fires on the
discrete keyboard open/close event — not during interaction — and there's no transform equivalent. Not suppressed, just
noting it.

GENERAL:

1. bugfix: the tab bar and toolbar at the right is shown whne the splashscreen is shown in dark mode.
4. the default filled in forms should open already with text selected
5. the sheet that access the keyboard e.g create new deck or create new folder should not elevate the whole app above
   the keyboard but just the sheet should be elevated and this is true for all widgets and controls of any kind across
   the app that access the keyboard
6. when selecting a deck of a folder or a subdeck, it gets little smaller like not so wide but this shouldnt happen, it
   should only be like a good animation when i hover over the folder or deck to drop to folder or deck but not when i
   reorder.


1. the type words mode doesnt correctly evaluate wrong words. when i type a letter and after that space and another
   wrong letter and space it gives such feedback and wrongly shows this /Users/kristianbraila/Downloads/IMG_2701.PNG,
   and also when i finish typing the initials it should be visible to the use that it is finised
   /Users/kristianbraila/Downloads/IMG_2700.PNG. also when i finish typing the words it should remain in this state with
   feedback and with text that i just typed and not that the type input removed see the images.
   /Users/kristianbraila/Downloads/IMG_2702.PNG /Users/kristianbraila/Downloads/IMG_2703.PNG


1. When i type a wrong letter in the type initials mode and type many wrong letter one after another, the wrong letter
   popup animatios is flickering but it should just replace the previous letter with new letter in this popup and the
   animation should be more smooth
2. when i type words, the feedback box should be like the wrong letter popup but persistent and also scrollable so that
   i can scroll it there is lot of text and therefore it should have a fixed height, after i close the keyboard, the
   feedback should be inlined back.


2. the shadows for the folders, decks subdecks, swipe actions section, and select mode and so on are not rendered
   correctly see here /Users/kristianbraila/Downloads/IMG_2604.PNG /Users/kristianbraila/Downloads/IMG_2602.PNG
3. the select toolbar is not above the tabnavigation bar and you should fix its placement across the app for all the
   select actions /Users/kristianbraila/Downloads/IMG_2603.PNG
4. improve the animation for the swipe and next card in the preview mode of the app when clikcing on the flashcard in
   the deck because it is flickering /Users/kristianbraila/Downloads/IMG_2605.PNG
7. the opened subdecks state and other states should be saved so that when the user closes the app and so on it saves it
   state across the app /Users/kristianbraila/Downloads/IMG_2609.jpg


1. the feedback popup above the keeyboard should have a fixed height and never changes the size, when i has too any
   words it jus tgets a scrollbar. and alos when i type more words than there are in the answer it stops writing
   feedback.
2. the wrong letter popup in hte type initials mode should be below the text box adn not inside the textbox


7. when i click on the select checkbox in the deck it should also select all of its subdecks and when i select only one
   subdeck the select checkbox of the deck should turn into the three state checkbox.
8. you should refactor the interactions when i select multiple controls like multiple folders decks subdecksk, cards
   they should like be stacked and dragged and dropped together and not just one which is not correct.

1. the bottom bar should be present only in the main pages like home and profile page and not in the folder or deck or
   whatever page it is.
2. we need to refactor this, now drag and drop will only be for reorder and if the user wants to move a deck to subdeck
   it should use the move sheet. and also the animations is not that smooth and the multidrag animation is not that
   correct. we need to fix when it lifts it should have the look like in this image '
   /Users/kristianbraila/Desktop/Screenshot 2026-07-24 at 23.28.36.png', but when it drops it should look like here  '
   /Users/kristianbraila/Desktop/Screenshot 2026-07-24 at 23.28.51.png'. also the stack should a real items behind it
   and not just stub controls that looks the same with all the selected items. and on the top should always be the last
   selected item and no the item on which i began the drag. and also the milisecond i release the stacked items, the
   count number on the right should disapear and the items get to their places from the behind the stack because they
   are rendered live and improve the animation and smoothness

3. the preview cards page also should render reald cards behind the card on the top and the next card should come from
   behind it and not just have a stub fake card behind it.


1. We must not have any notifications and no passwordbox or username box focused before the splashscreen is finished
2. When selecting cards in the deck it should work like in the homepage e.g. the header changes to select all and cancel
   and so on , and the headers should be unified so that we dont have duplicate information and so on
3. Flashcards behind the current flashcard should alos render all controls like buttons, labels, and so on
4. refactor the toolbar in the homepage to hide the bottom bar nav when using select mode
5. we need to make the header and the footer of the drawers smaller to maximize the content area


1. unify the headers from all the pages so that we use one header with fixed height, same sizes for the buttons back adn
   setings button and so on.



1. We need to refactor the whole flashcards settings and algorithms and deck settings using this examples
2. We need all the features and options, except ai features now as well as deck publishing or sharing, report deck and offline cards options. this is how the deck settings page will look now firstlty you neeedd to look at all of the settings pages and refactor our settings page completely and for now just make the ui to look like this and backend we will add in next phase. 

'/Users/kristianbraila/Downloads/new_settings/IMG_2502.PNG'
'/Users/kristianbraila/Downloads/new_settings/IMG_2600.PNG'

1. we need the fast review and the general spaced repetition algorithms. this is the sheet that comes to chose the algorithm when the user clicks on the button in the algorithm settings
'/Users/kristianbraila/Downloads/new_settings/algorightSettings/IMG_2596.PNG'
'/Users/kristianbraila/Downloads/new_settings/algorightSettings/IMG_2598.PNG'
'/Users/kristianbraila/Downloads/new_settings/algorightSettings/IMG_2599.PNG'

2. thsi is the card and its actions sheet
/Users/kristianbraila/Downloads/new_settings/cardsAndTheirActionsSheet/IMG_2486.PNG'
'/Users/kristianbraila/Downloads/new_settings/cardsAndTheirActionsSheet/IMG_2487.PNG'
'/Users/kristianbraila/Downloads/new_settings/cardsAndTheirActionsSheet/IMG_2488.PNG'

3. we will also have a page for card styles
'/Users/kristianbraila/Downloads/new_settings/cardstyles/IMG_2096.PNG'

4. this is how the page and cards will look when we choose fast review algorithm
'/Users/kristianbraila/Downloads/new_settings/fast-review/IMG_2595.PNG'
'/Users/kristianbraila/Downloads/new_settings/fast-review/IMG_2597.PNG'

5. this is how the page and cards will look when we choose spaced repetition algorithm

/Users/kristianbraila/Downloads/new_settings/spaced_repetition/IMG_2500.PNG
/Users/kristianbraila/Downloads/new_settings/spaced_repetition/IMG_2601.PNG


3. remove the finish button from the  flashcard settings or make it close the drawer and not to finish the session. also move all the unrelated setting to the top header and the mode specific settings leave on the flashcard itself like it is now 
4. In the deck page where the algorithm is overviewd and it has a button next to it that shows the same  info from the  change algorith drawer, remove this drawer and make it one with the _Fast review !_ like this When i click it just opens this change algorithm drawer
5. In the show initial mode when i click on the letter and the popup is shown it should be only shown when is focused and when not it disapears
6. In the questions page you should make all the option availabel from the page without a dial when there are no questions, and move the export function to the questions settings and it leaves only there

8. the flashcards in the study mode doesnt behave correctly e.g. when the text is too long they dont habe a fixed height and become a  scrollbar but get higher and push the bottom grades bar behind the screen edge like this /Users/kristianbraila/Downloads/IMG_3147.png and the same happens in the edit card page  /Users/kristianbraila/Downloads/IMG_3145.png 
9. in the select toolbar page the toolbaar options are elevated without the x button but should be with 
10. in the flashcard mode drawer the initials mode should be above the rebuild mode


   1. the import button in the deck settings doesnt work correctly 
   2. the duplicate and archive deck buttons hould have a dialog to ask whether i realy want to duplicate it  or archive it and after i archive it it should instantly leave this arhcive and go to the home page
   3. the algorithm choosing buttton colors merge too many into the page background and doenst have the same outlines and colors as other buttons
   4. in the card styles there should be no transparent card and improve the styles
   5. also the styles can not only change the cards styles but also the study screen background and styles and so on like here  /Users/kristianbraila/Downloads/IMG_3237.png /Users/kristianbraila/Downloads/IMG_3238.png 
   6. and so look the page when i didnt change any card styles and after i change, comes a persisted bottom bar imovable that has this button apply /Users/kristianbraila/Downloads/IMG_3239.png /Users/kristianbraila/Downloads/IMG_3240.png. when somethning doesnt fit the page is divided is this peaceas: when no changes are maded and we have no persisted bottom bar then the page is divided in two peaces: first is for the card and how it will look like that is persisted and the other will have scroll bar like this /Users/kristianbraila/Downloads/IMG_3241.png and when something has changed and  we have the bottom bar we will have three parts and  a flashcard part and a editing controls part and a bottom bar part like this also with a scroll bar /Users/kristianbraila/Downloads/IMG_3243.png /Users/kristianbraila/Downloads/IMG_3242.png 





BUGS:

1. StatusBar gets white when a notification animations gets close to the StatusBar
2. The app native SplashScreen features are not reliable and not working.
3. Remove the Form Accessory Bar with Capacitor

4. superpowers and /impeccable the status bar background is not very reliable at all, whenever something happens in the
   app like notification comes and it toches the status bar by hiding the status bar gets recolored. fix and debug this
   so that we can it stays also colored in our background and we in our app log or know whenever something weird happens
   and the status bar gets white




<!--

/impeccable craft create something like this in our app. this should be all capable ai tutor, i can ask it to create rooms to create palaces to edit or search settings to edit the profile and more and more. for this it will have an interface for how to interact with our app. it will be able to do anything in our app that i will ask it to do, but first before executing it should promt me for permission for this specific action to take. it also can generate locies and quizes and so on.
 /Users/kristianbraila/Downloads/AITutorScreen.tsx 
 
 -->

