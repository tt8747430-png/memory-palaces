import { actions, boot, common, nav, select, selection, slots, swipe, update } from './core'
import { archived, deck, folder, home, library, move } from './library'
import { notifications } from './notifications'
import {
  algorithm,
  cardActions,
  cardProgress,
  cardStyle,
  deckSettings,
  fastReview,
  tts,
} from './deck-settings'
import { sync } from './sync'
import { account } from './account'
import { auth } from './auth'
import { cards, grade, match, practice, questions, quiz, reward, srs, study } from './study'
import {
  achievementDetail,
  achievements,
  achievementsPage,
  badgeDetail,
  badges,
  profile,
  progress,
  streak,
} from './profile'
import { settings } from './settings'

export const en = {
  common,
  selection,
  deck,
  folder,
  move,
  library,
  deckSettings,
  algorithm,
  cardStyle,
  cardActions,
  cardProgress,
  fastReview,
  tts,
  sync,
  account,
  boot,
  update,
  nav,
  home,
  archived,
  grade,
  srs,
  profile,
  auth,
  achievements,
  badges,
  badgeDetail,
  achievementDetail,
  achievementsPage,
  streak,
  practice,
  cards,
  questions,
  study,
  quiz,
  match,
  reward,
  progress,
  settings,
  actions,
  slots,
  swipe,
  select,
  notifications,
} as const

export type AppResources = typeof en
