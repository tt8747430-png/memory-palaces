/** Canonical route paths. The router (app/) and any navigation read from here. */
export const ROUTES = {
  home: '/',
  palaces: '/palaces',
  palaceDetail: '/palaces/$palaceId',
  palaceQuiz: '/palaces/$palaceId/quiz',
  roomContent: '/rooms/$roomId',
  roomTrain: '/rooms/$roomId/train',
  review: '/review',
  profile: '/profile',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
