import { srsStatus, type SrsState } from './srs'

/**
 * Derived progress numbers. None of these are stored on entities — they are
 * computed from source-of-truth state so counts can never drift. Functions take
 * minimal structural shapes, keeping `shared/lib` below the entity layer.
 */
const XP_PER_LEVEL = 250

export interface LevelInfo {
  level: number
  xpInLevel: number
  xpForNextLevel: number
}

export function levelFromXp(xp: number): LevelInfo {
  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    xpInLevel: xp % XP_PER_LEVEL,
    xpForNextLevel: XP_PER_LEVEL,
  }
}

type Reviewable = { srs?: SrsState }

/** A locus counts as reviewed once it has left the "new" state. */
export function isLocusReviewed(locus: Reviewable): boolean {
  return (locus.srs?.reps ?? 0) > 0
}

export function roomProgress(loci: ReadonlyArray<Reviewable>): number {
  if (loci.length === 0) return 0
  const reviewed = loci.filter(isLocusReviewed).length
  return Math.round((reviewed / loci.length) * 100)
}

export function isRoomCompleted(loci: ReadonlyArray<Reviewable>): boolean {
  return loci.length > 0 && loci.every(isLocusReviewed)
}

export interface TrainingTotals {
  roomsCompleted: number
  totalRooms: number
  totalCards: number
}

/**
 * Roll up training progress across a whole library. Takes minimal structural shapes —
 * rooms as `{ id }`, loci as `{ roomId, srs? }` — so it stays below the entity layer.
 * A room counts as completed only when every one of its loci is reviewed; empty rooms
 * never count (via `isRoomCompleted`).
 */
export function computeTrainingTotals(
  rooms: ReadonlyArray<{ id: string }>,
  loci: ReadonlyArray<Reviewable & { roomId: string }>,
): TrainingTotals {
  const lociByRoom = new Map<string, Reviewable[]>()
  for (const locus of loci) {
    const group = lociByRoom.get(locus.roomId)
    if (group) group.push(locus)
    else lociByRoom.set(locus.roomId, [locus])
  }

  const roomsCompleted = rooms.filter((room) =>
    isRoomCompleted(lociByRoom.get(room.id) ?? []),
  ).length

  return { roomsCompleted, totalRooms: rooms.length, totalCards: loci.length }
}

export function palaceProgress(roomCompletions: ReadonlyArray<boolean>): number {
  if (roomCompletions.length === 0) return 0
  const done = roomCompletions.filter(Boolean).length
  return Math.round((done / roomCompletions.length) * 100)
}

/**
 * Rooms unlock sequentially: the first is always open; each later room opens
 * once the previous one is complete. `roomCompletions` is ordered by room order.
 */
export function isRoomUnlocked(index: number, roomCompletions: ReadonlyArray<boolean>): boolean {
  if (index <= 0) return true
  return roomCompletions[index - 1] === true
}

/** Tally a card set by maturity bucket (independent of due-ness). */
export function cardMaturityCounts(
  loci: ReadonlyArray<{ srs?: SrsState }>,
): { new: number; learning: number; known: number } {
  const counts = { new: 0, learning: 0, known: 0 }
  for (const locus of loci) counts[srsStatus(locus.srs)] += 1
  return counts
}
