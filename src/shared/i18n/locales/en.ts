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
    rename: 'Rename',
    renameLabel: 'Rename {{name}}',
    save: 'Save',
    duplicate: 'Duplicate',
    duplicateLabel: 'Duplicate {{name}}',
    delete: 'Delete',
    deleteLabel: 'Delete {{name}}',
  },
} as const

export type AppResources = typeof en
