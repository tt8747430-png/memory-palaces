You are the world's leading Senior Software Engineer and UI/UX Designer, operating with the cutting-edge standards and
frameworks of 2026. Your objective is to build elegant, high-performance, and deeply intuitive solutions for our Memory
Palace application.

🎯 Core Principles

Zero Legacy / No Backwards Compatibility: Write code strictly for modern runtimes and the latest stable framework
versions. Do not pollute code with polyfills, fallback logic, or deprecated APIs.
Optimal Over Overengineered: Prioritize clean, readable, and maintainable architecture. Avoid premature abstraction,
deeply nested patterns, or unnecessary third-party dependencies. Choose the simplest execution that scales. and finish
the settings page with all its components and functionality.

🛠️ Execution Rules

Refactoring: When modifying existing code, aggressively ruthlessly rip out legacy patterns, unused boilerplate, and
outdated infrastructure. Adapt everything to the new architecture.
Design Quality: Ensure micro-interactions, layout spacing (Tailwind), and UI states (loading, error, empty) look
premium, clean, and intentional.
Completeness: Provide fully realized code blocks. Avoid placeholders, truncated code (`// ...`), or leaving "implement
later" comments unless explicitly requested.

📋 Task:


1. bugfix: the tab bar is shown whne the splashscreen is shown in dark mode. 
no 2. when clicking on the folder name in the header i except it to look like it is clickable and when clicking on it will open the edit folder settings and after that remove teh edit button on the right. this should be done across the app. 
3. improve the archive functionality and what the archive should actualy do because for now it is just like  a separate folder. it should have real behaviour and be like actual archive. like in an zip archive or so. i can see but not edit or something like that. 
4. remove the finish button from the settings.



1. we need to refactor the whole structure of the app. now we will have three types and this will be: 

folders: that can have decks inside them i gave you also the photos how a folder looks like this is the Biblia folder and how its three dots on the right top header look like.  /Users/kristianbraila/Downloads/IMG_2460.PNG /Users/kristianbraila/Downloads/IMG_2461.PNG /Users/kristianbraila/Downloads/IMG_2462.PNG

decks: this will be the holders of the flashcards and the whole learning system they will have settings as whole page in the top right three dots click with such  looks /Users/kristianbraila/Downloads/IMG_2500.PNG /Users/kristianbraila/Downloads/IMG_2501.PNG /Users/kristianbraila/Downloads/IMG_2502.PNG


subdecks: each deck can have as many subdecks as the user wants and also this subdecks can have as many subdecks as the user wants and so on and and a deck without any subdecks or a subdeck withou any subdecks will look like the Bible Questions deck or like the Bible Memory subdeck. and the deck with other subdecks will be like the Versetele Talantul with this plus sign and tree overview. 

and when the user click on the deck that has many subdecks it will open all the cards that are inside this deck but when the user click on subdeck it will open all the cards that are in this subdeck and other subdecks that this subdeck has



/Users/kristianbraila/Downloads/IMG_2457.PNG /Users/kristianbraila/Downloads/IMG_2458.PNG /Users/kristianbraila/Downloads/IMG_2459.PNG /Users/kristianbraila/Downloads/IMG_2460.PNG /Users/kristianbraila/Downloads/IMG_2461.PNG /Users/kristianbraila/Downloads/IMG_2462.PNG /Users/kristianbraila/Downloads/IMG_2463.PNG /Users/kristianbraila/Downloads/IMG_2464.PNG


 
BUGS:

1. StatusBar gets white when a notification animations gets close to the StatusBar
2. The app native SplashScreen features are not reliable and not working. 
3. Remove the Form Accessory Bar with Capacitor 

 11. superpowers and /impeccable the status bar background is not very reliable at all, whenever something happens in the app like notification comes and it toches the status bar by hiding the status bar gets recolored. fix and debug this so that we can it stays also colored in our background and we in our app log or know whenever something weird happens and the status bar gets white
   
   /Users/kristianbraila/Downloads/bugs_fixed/IMG_2152.PNG /Users/kristianbraila/Downloads/bugs_fixed/IMG_2153.PNG



<!--

/impeccable craft create something like this in our app. this should be all capable ai tutor, i can ask it to create rooms to create palaces to edit or search settings to edit the profile and more and more. for this it will have an interface for how to interact with our app. it will be able to do anything in our app that i will ask it to do, but first before executing it should promt me for permission for this specific action to take. it also can generate locies and quizes and so on.
 /Users/kristianbraila/Downloads/AITutorScreen.tsx 
 
 -->