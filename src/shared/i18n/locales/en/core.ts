export const common = {
  appName: 'Mindscape',
  cancel: 'Cancel',
  undo: 'Undo',
  moreOptions: 'More options',
  seeAll: 'See all',
  back: 'Back',
  close: 'Close',
  edit: 'Edit',
  delete: 'Delete',
  saveChanges: 'Save changes',
  gotIt: 'Got it',
  offline: "You're offline. This one needs a connection — reconnect and try again.",
} as const

export const selection = {
  selectAll: 'Select all',
  clearAll: 'Clear all',
  count: '{{count}} selected',
  exitSelectMode: 'Exit select mode',
} as const

export const boot = {
  failedTitle: 'Mindscape could not start',
  failedBody:
    'Your decks are safe on this device — the app just could not open its database. Reload to try again.',
  reload: 'Reload',
} as const

export const update = {
  available: 'A new version is ready',
  description: 'Reload to get the latest Mindscape.',
  reload: 'Reload',
} as const

export const nav = {
  label: 'Primary',
  home: 'Home',
  profile: 'Profile',
} as const

export const actions = {
  favorite: 'Favorite',
  style: 'Style',
  move: 'Move',
  archive: 'Archive',
  unfile: 'Unfile',
  settings: 'Settings',
  edit: 'Edit',
  addSubdeck: 'Subdeck',
  addDeck: 'Add deck',
  duplicate: 'Duplicate',
  reset: 'Reset',
  resetMenu: 'Reset schedule',
  flag: 'Flag',
  known: 'Mastered',
  knownMenu: 'Mark as mastered',
  select: 'Select',
  grade: 'Grade',
  gradeMenu: 'Set grade & schedule',
  studyFrom: 'Study',
  studyFromMenu: 'Study from this card',
  freeze: 'Freeze',
  unfreeze: 'Unfreeze',
  reverse: 'Reverse',
  unreverse: 'Unreverse',
  history: 'History',
  historyMenu: 'Learning history',
  delete: 'Delete',
} as const

export const swipe = {
  title: 'Swipe actions',
  subtitle: 'Pick what a left or right swipe does on each kind of list row.',
  leading: 'Swipe right',
  trailing: 'Swipe left',
  sideCount: '{{count}} / {{max}}',
  reset: 'Reset to defaults',
  reorderLabel: 'Reorder {{name}}',
  removeLabel: 'Remove {{name}} from this swipe',
  types: {
    deck: 'Decks',
    folder: 'Folders',
    card: 'Cards',
  },
  sample: {
    deck: 'Deck name',
    folder: 'Folder name',
    card: 'Card front',
  },
} as const

export const select = {
  title: 'Select toolbar',
  subtitle:
    'Choose the actions the toolbar offers while you have decks, cards or questions selected.',
  inBar: 'In the toolbar',
  available: 'Available actions',
  slots: '{{count}} / {{max}}',
  full: 'The toolbar is full — remove an action to add another.',
  allInUse: 'Every action is in the toolbar.',
  reset: 'Reset to defaults',
  addLabel: 'Add {{name}} to the toolbar',
  removeLabel: 'Remove {{name}} from the toolbar',
  reorderLabel: 'Reorder {{name}}',
  surfaces: {
    library: 'Decks',
    card: 'Cards',
    question: 'Questions',
  },
} as const
