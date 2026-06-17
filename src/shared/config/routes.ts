/** Canonical route paths. The router (app/) and any navigation read from here. */
export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  forgot: '/forgot',
  welcome: '/welcome',
  palaces: '/palaces',
  palaceDetail: '/palaces/$palaceId',
  palaceQuiz: '/palaces/$palaceId/quiz',
  roomContent: '/rooms/$roomId',
  roomTrain: '/rooms/$roomId/train',
  roomMatch: '/rooms/$roomId/match',
  roomVerse: '/rooms/$roomId/verse',
  review: '/review',
  profile: '/profile',
  stats: '/stats',
  settings: '/settings',
  settingsProfile: '/settings/profile',
  settingsChangePassword: '/settings/change-password',
  settingsPhone: '/settings/phone',
  settingsPrivacy: '/settings/privacy',
  settingsClearData: '/settings/clear-data',
  settingsHelp: '/settings/help',
  settingsAbout: '/settings/about',
  notifications: '/notifications',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
