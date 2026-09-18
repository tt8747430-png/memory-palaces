import type { BibleKey } from '../i18n/use-bible-t'
import type { Testament } from '../model/canon'

/** Each shelf's heading — the picker's grid and the settings page's coverage list share it. */
export const TESTAMENT_TITLE: Record<Testament, BibleKey> = {
  old: 'oldTestament',
  new: 'newTestament',
}
