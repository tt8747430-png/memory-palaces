/**
 * The one locale, assembled from one file per domain. Still one locale, still one namespace — the
 * split only means a copy change touches a 200-line file instead of a 1,300-line one. Keys keep
 * the order they had in the single file.
 */
import { actions, boot, common, nav, select, selection, swipe, update } from './core'
import { archived, deck, folder, home, library, move, notifications } from './library'
import { algorithm, cardActions, cardStyle, deckSettings, fastReview, tts } from './deck-settings'
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
  swipe,
  select,
  notifications,
} as const

export type AppResources = typeof en
