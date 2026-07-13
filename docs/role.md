SETTINGS:
3. remove the finish button from the settings.



GENERAL:





REFACTORINGS:
1. We need to refactor the whole flashcards settings and algorithms using this example: 
1. We dont need ai features now as well as deck publishing or sharing and  




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
   
   /Users/kristianbraila/Downloads/bugs_fixed/IMG_2152.PNG /Users/kristianbraila/Downloads/bugs_fixed/IMG_2153.PNG

<!--

/impeccable craft create something like this in our app. this should be all capable ai tutor, i can ask it to create rooms to create palaces to edit or search settings to edit the profile and more and more. for this it will have an interface for how to interact with our app. it will be able to do anything in our app that i will ask it to do, but first before executing it should promt me for permission for this specific action to take. it also can generate locies and quizes and so on.
 /Users/kristianbraila/Downloads/AITutorScreen.tsx 
 
 -->

