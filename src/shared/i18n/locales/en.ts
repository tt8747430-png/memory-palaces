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
} as const

export type AppResources = typeof en
