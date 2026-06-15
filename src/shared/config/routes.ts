/** Canonical route paths. The router (app/) and any navigation read from here. */
export const ROUTES = {
  home: '/',
  palaces: '/palaces',
  palaceDetail: '/palaces/$palaceId',
  roomContent: '/rooms/$roomId',
  profile: '/profile',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
