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
  done: 'Done',
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
  sortSubdecks: 'Sort subdecks',
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

/** The strip of action slots both settings screens arrange, and the sheet its `+` opens. */
export const slots = {
  count: '{{count}} / {{max}}',
  add: 'Add an action to {{strip}}',
  pick: 'Add to {{strip}}',
  reorder: 'Reorder {{name}}',
  remove: 'Remove {{name}}',
  empty: 'Empty — tap + to put an action here.',
  allInUse: 'Every action is already in use.',
} as const

export const swipe = {
  title: 'Swipe actions',
  subtitle: 'Pick what a left or right swipe does on each kind of list row.',
  leading: 'Swipe right',
  trailing: 'Swipe left',
  reset: 'Reset to defaults',
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
  reset: 'Reset to defaults',
  surfaces: {
    library: 'Decks',
    card: 'Cards',
    question: 'Questions',
  },
} as const
