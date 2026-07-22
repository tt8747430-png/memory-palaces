# Problems

1. the type words mode doesnt correctly evaluate wrong words. when i type a  letter and after that space and another wrong letter and space it gives such feedback and wrongly shows this /Users/kristianbraila/Downloads/IMG_2701.PNG,  and also when i finish typing the initials it should be visible to the use that it is finised  /Users/kristianbraila/Downloads/IMG_2700.PNG. also when i finish typing the words it should remain in this state with feedback and with text that i just typed and not that the type input removed see the images. /Users/kristianbraila/Downloads/IMG_2702.PNG /Users/kristianbraila/Downloads/IMG_2703.PNG



1. When i type a wrong letter in the type initials mode and type many wrong letter one after another, the wrong letter popup animatios is flickering but it should just replace the previous letter with new letter in this popup and the animation should be more smooth
2. when i type words, the feedback box should be like the wrong letter popup but persistent and also scrollable so that i can scroll it there is lot of text and therefore it should have a fixed height, after i close the keyboard, the feedback should be inlined back. 

GENERAL:
2. the shadows for the folders, decks subdecks, swipe actions section, and select mode and so on are not rendered correctly see here /Users/kristianbraila/Downloads/IMG_2604.PNG /Users/kristianbraila/Downloads/IMG_2602.PNG
3. the select toolbar is not above the tabnavigation bar and you should fix its placement across the app for all the select actions /Users/kristianbraila/Downloads/IMG_2603.PNG 
4. improve the animation for the swipe and next card in the preview mode of the app when clikcing on the flashcard in the deck because it is flickering /Users/kristianbraila/Downloads/IMG_2605.PNG
7. the opened subdecks state and other states should be saved so that when the user closes the app and so on it saves it state across the app /Users/kristianbraila/Downloads/IMG_2609.jpg
8. you should refactor the interactions when i select multiple controls like multiple folders decks subdecksk, cards they should like be stacked and dragged and dropped together and not just one which is not correct. 




REFACTORINGS:
SETTINGS:
3. remove the finish button from the settings.


1. We need to refactor the whole flashcards settings and algorithms and deck settings using this examples
1. We dont need ai features now as well as deck publishing or sharing, report deck and offline cards options. 

'/Users/kristianbraila/Downloads/new_settings/algorightSettings' 
'/Users/kristianbraila/Downloads/new_settings/algorightSettings/IMG_2596.PNG' 
'/Users/kristianbraila/Downloads/new_settings/algorightSettings/IMG_2598.PNG' 
'/Users/kristianbraila/Downloads/new_settings/algorightSettings/IMG_2599.PNG' 
'/Users/kristianbraila/Downloads/new_settings/cardsAndTheirActionsSheet' '
/Users/kristianbraila/Downloads/new_settings/cardsAndTheirActionsSheet/IMG_2486.PNG' 
'/Users/kristianbraila/Downloads/new_settings/cardsAndTheirActionsSheet/IMG_2487.PNG' 
'/Users/kristianbraila/Downloads/new_settings/cardsAndTheirActionsSheet/IMG_2488.PNG' 
'/Users/kristianbraila/Downloads/new_settings/cardstyles' 
'/Users/kristianbraila/Downloads/new_settings/cardstyles/IMG_2096.PNG' 
'/Users/kristianbraila/Downloads/new_settings/fast-review' 
'/Users/kristianbraila/Downloads/new_settings/fast-review/IMG_2595.PNG' 
'/Users/kristianbraila/Downloads/new_settings/fast-review/IMG_2597.PNG' 
'/Users/kristianbraila/Downloads/new_settings/spaced_repetition' 
'/Users/kristianbraila/Downloads/new_settings/spaced_repetition/IMG_2500.PNG' 
'/Users/kristianbraila/Downloads/new_settings/IMG_2502.PNG' 
'/Users/kristianbraila/Downloads/new_settings/IMG_2600.PNG'




FEATURES:
8. we dont have onboarding and guest account lacks customizability































fixed: 

SELECTMODE:
1. the select mode toolbar should also be customizable and have more features. 

ANIMATIONS:
2. the select mode doesnt correctly elevate the controls. they should be elevated as they are also with the select checbox and so on. and i want also to be able to drag and drop a real deck onto a real deck and this deck will become its subdeck and so on. also the decks reordering is flickerring animatinons.  fix this bug 
5. bug: the progressbars are reloaded animation anytime i change the page and this is anoying. this should maybe only be when suitable e.g. in the badges progress animtations and so on
6. add to claude fix of the drag animation flickering and fix after that the flickering in the toolbar actions reorder settings 

FLASHCARDS:
3. the type and rebuild flashcard modes should start in the initial state and no in the flipped state e.g. if i change the mode from the blur flipped mode. and also when the flashcards was solved in the rebuilt mode it shouldnt be flippable again and only the reset button will reset the flip action and other actions. and after it is rebuild the overview -solved tap to see the answer also will be removed. and the same with the type initials mode.  and the type words flashcard mode also should be somehow refactored to improve the user interactions. conslut me on these issue if it is a good proposal
4. inside a feedback text box control in the type flashcard mode i cant fully and reliable scroll whne the content is too high and it triggers the flashcard swipe mode. and also the page shouldnt be scrollable in none of the modes and only the contents between the flashcard headers and flashcard footers should be scrollabel like a real page when it is needed and there is too much text, therefore it should be flexible and adaptable to all types of contents 

/impeccable /grill-with-docs
your changes from the flashcard modes and scroll design spec are not working reliable or not working at all 

1. the type words mode doesnt correctly evaluate wrong words and maybe when a word is wrong and the word after that is correct it should also show a apropriate feedback. this is photo '/Users/kristianbraila/Desktop/Screenshot 2026-07-14 at 00.43.33.png'

5. in the blur flashcards mode the buttons blur and show all must be the same size or so  /Users/kristianbraila/Downloads/IMG_2606.PNG
6. the rebuild mode and the type mode always should start in the flashcard face mode igroring in which state back or front it was before we switched to this mode 

3. we still have the bug that the controls are not correctly elevated or the sheets are not correctly elevated when the user open the keyboard. see here /Users/kristianbraila/Downloads/IMG_2610.PNG /Users/kristianbraila/Downloads/IMG_2621.PNG  /Users/kristianbraila/Downloads/IMG_2622.PNG
i only want the sheets to be elevated and not the whole app and event when i scroll bar to the top, the sheet looks awful with these transparent space between the sheet and the keyboard toolbar, this should not be like this. 

you said also: 
On-device check for #5: desktop browsers don't fire soft-keyboard visualViewport events, so I verified the logic + types/lint/tests but couldn't exercise the actual keyboard here. Worth a quick pass on a real phone (create-deck sheet, the type-answer study mode, and the card/question editors).
The design hook flagged the height transition on .kb-fit as a layout-animation. I left it intentionally: shrinking the shell by the keyboard's height is the correct model (it's what native resizes-content did), it only fires on the discrete keyboard open/close event — not during interaction — and there's no transform equivalent. Not suppressed, just noting it.



GENERAL:
1. bugfix: the tab bar and toolbar at the right  is shown whne the splashscreen is shown in dark mode. 
4. the default filled in forms should open already with text selected 
5. the sheet that access the keyboard e.g  create new deck or create new folder should not elevate the whole app above the keyboard but just the sheet should be elevated and this is true for all widgets and controls of any kind across the app  that access the keyboard  
6. when selecting a deck of a folder or a subdeck, it gets little smaller like not so wide but this shouldnt happen, it should only be like a good animation when i hover over the folder or deck to drop to folder or deck but not when i reorder. 












BUGS:

 1. StatusBar gets white when a notification animations gets close to the StatusBar
 2. The app native SplashScreen features are not reliable and not working. 
 3. Remove the Form Accessory Bar with Capacitor 

 4. superpowers and /impeccable the status bar background is not very reliable at all, whenever something happens in the app like notification comes and it toches the status bar by hiding the status bar gets recolored. fix and debug this so that we can it stays also colored in our background and we in our app log or know whenever something weird happens and the status bar gets white

<!--

/impeccable craft create something like this in our app. this should be all capable ai tutor, i can ask it to create rooms to create palaces to edit or search settings to edit the profile and more and more. for this it will have an interface for how to interact with our app. it will be able to do anything in our app that i will ask it to do, but first before executing it should promt me for permission for this specific action to take. it also can generate locies and quizes and so on.
 /Users/kristianbraila/Downloads/AITutorScreen.tsx 
 
 -->

