/** English source-of-truth strings. Structure is i18n-ready from day one (v1 = en). */
export const en = {
  common: {
    appName: 'Mindscape',
    tagline: 'Your Memory Palace',
  },
  home: {
    greeting: 'Welcome back, {{name}}',
    greetingGuest: 'Welcome, {{name}}',
    subtitle: 'A calm place to train your memory.',
    primaryCta: 'Start a session',
    guestNote: "You're exploring as a guest. Your progress is saved on this device.",
  },
  palaces: {
    title: 'Your palaces',
    subtitle: 'Build and revisit your memory palaces.',
    empty: 'No palaces yet. Name your first one above.',
    createLabel: 'New palace name',
    createPlaceholder: 'Name a new palace…',
    create: 'Create',
    open: 'Open',
    openLabel: 'Open {{name}}',
    rename: 'Rename',
    renameLabel: 'Rename {{name}}',
    save: 'Save',
    duplicate: 'Duplicate',
    duplicateLabel: 'Duplicate {{name}}',
    delete: 'Delete',
    deleteLabel: 'Delete {{name}}',
  },
  palaceDetail: {
    back: 'Back to palaces',
    notFound: 'That palace could not be found.',
    roomsHeading: 'Rooms',
  },
  rooms: {
    empty: 'No rooms yet. Add the first stop on your journey above.',
    createLabel: 'New room title',
    createPlaceholder: 'Name a new room…',
    create: 'Add room',
    rename: 'Rename',
    renameLabel: 'Rename {{title}}',
    save: 'Save',
    delete: 'Delete',
    deleteLabel: 'Delete {{title}}',
    moveUp: 'Up',
    moveUpLabel: 'Move {{title}} up',
    moveDown: 'Down',
    moveDownLabel: 'Move {{title}} down',
  },
} as const

export type AppResources = typeof en
