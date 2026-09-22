import type { SwipeActionId, SwipeConfig } from '@/shared/config/swipe'

/**
 * The row itself, standing in the list where the two rails meet. A swipe's two sides are not two
 * lists to be edited separately — they are one run of actions with the row somewhere in the middle,
 * and which side an action is on is simply which side of the row it sits on.
 *
 * Making that literal is what lets a single sortable list do all of it: reorder within a rail, move
 * an action across, and so change how many each rail holds. Two lists would have
 * needed cross-container drag handling to say the same thing less clearly.
 */
export const ROW = '__row__'

export type RailItem = SwipeActionId | typeof ROW

export const isRow = (item: RailItem): item is typeof ROW => item === ROW

/** The two rails as one list, with the row between them. */
export function railsToFlat(config: SwipeConfig): RailItem[] {
  return [...config.leading, ROW, ...config.trailing]
}

/**
 * The list back into two rails. A list that has lost its row — which nothing here can produce, but
 * a stale drop could — is read as all leading, because that is where a list with no row ends.
 */
export function flatToRails(flat: readonly RailItem[]): SwipeConfig {
  const at = flat.indexOf(ROW)
  const cut = at < 0 ? flat.length : at
  return {
    leading: flat.slice(0, cut).filter((item): item is SwipeActionId => !isRow(item)),
    trailing: flat.slice(cut + 1).filter((item): item is SwipeActionId => !isRow(item)),
  }
}
