import { isDue, type SrsState } from './srs'

/**
 * Builds the cross-library review queue over the normalized collections. Takes
 * minimal structural shapes (not entity types) so `shared/lib` stays below the
 * entity layer; the real `Palace`/`Room`/`Locus` satisfy them structurally.
 */
export interface DuePalace {
  id: string
  name: string
  archived?: boolean
}

export interface DueRoom {
  id: string
  palaceId: string
  title: string
}

export interface DueLocus {
  id: string
  roomId: string
  srs?: SrsState
}

/** A due card resolved with the palace/room context needed to grade it. */
export interface DueCard {
  palaceId: string
  palaceName: string
  roomId: string
  roomTitle: string
  locus: DueLocus
}

/**
 * Every locus due now, skipping archived palaces and orphaned loci. A locus with
 * no SRS state is brand new and counts as due. Order follows the `loci` array.
 */
export function getDueLoci(
  palaces: readonly DuePalace[],
  rooms: readonly DueRoom[],
  loci: readonly DueLocus[],
  now: number,
): DueCard[] {
  const activePalaces = new Map(
    palaces.filter((palace) => !palace.archived).map((palace) => [palace.id, palace]),
  )
  const roomsById = new Map(rooms.map((room) => [room.id, room]))

  const due: DueCard[] = []
  for (const locus of loci) {
    if (!isDue(locus.srs, now)) continue
    const room = roomsById.get(locus.roomId)
    if (!room) continue
    const palace = activePalaces.get(room.palaceId)
    if (!palace) continue
    due.push({
      palaceId: palace.id,
      palaceName: palace.name,
      roomId: room.id,
      roomTitle: room.title,
      locus,
    })
  }
  return due
}

/** Count of cards due across the library (for the Home feed badge). */
export function countDueLoci(
  palaces: readonly DuePalace[],
  rooms: readonly DueRoom[],
  loci: readonly DueLocus[],
  now: number,
): number {
  return getDueLoci(palaces, rooms, loci, now).length
}

/**
 * Cards due now, tallied per palace, so the Palaces browser can surface what each
 * palace owes the user today — turning a static "mastery" list into a pull back into
 * practice. Archived palaces and orphaned loci are skipped (via {@link getDueLoci}), so
 * an absent id simply means nothing is due.
 */
export function countDuePerPalace(
  palaces: readonly DuePalace[],
  rooms: readonly DueRoom[],
  loci: readonly DueLocus[],
  now: number,
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const card of getDueLoci(palaces, rooms, loci, now)) {
    counts.set(card.palaceId, (counts.get(card.palaceId) ?? 0) + 1)
  }
  return counts
}
