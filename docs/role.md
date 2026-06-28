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


1. Refactor the whole select mechanism for the palaces and folders and rooms and locies. NOW i want that the long tap on any of these should enter the select mode and in this select mode will apear the posibility to drag and drop and reorder them and the icon at the left that indicates that the item can be drag and dropeed

2. also remove the select button from everywhere in the app including folders palaces rooms and locies. 

3. all of the items in the list view, that is the default of the views and should be at the first option in the selection of the viewmodes, should have the swipe to left and swipe to right options and this should be customizable in the options. also restyles the option in this examples. and when the user swipes left or right, the most right of the most left action  should be activated like in these examples /Users/kristianbraila/Downloads/IMG_2121.PNG /Users/kristianbraila/Downloads/IMG_2122.PNG /Users/kristianbraila/Downloads/IMG_2123.PNG /Users/kristianbraila/Downloads/IMG_2124.PNG

4. For adding flashcards add a separate page for this. and for create palaces sheet remove the posibility to add cover photo, it remain in the palaces settings. by adding a room drop the descriptioin from the sheet and keep this in the room settings.  and remove all the mythology stuff from all the placeholders add more generic or bible stuff better. 




<!--
/impeccable craft create something like this in our app. this should be all capable ai tutor, i can ask it to create rooms to create palaces to edit or search settings to edit the profile and more and more. for this it will have an interface for how to interact with our app. it will be able to do anything in our app that i will ask it to do, but first before executing it should promt me for permission for this specific action to take. it also can generate locies and quizes and so on.
 /Users/kristianbraila/Downloads/AITutorScreen.tsx -->



BUGS:

1. StatusBar gets white when a notification animations gets close to the StatusBar
2. The app native SplashScreen features are not reliable and not working. 
3. Remove the Form Accessory Bar