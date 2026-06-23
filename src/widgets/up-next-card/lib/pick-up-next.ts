import { isDue, srsStatus, type SrsState } from '@/shared/lib'

/** Minimal structural inputs (the real Palace/Room/Locus satisfy them), so the picker
 * stays pure and trivially testable. */
export interface UpNextPalace {
  id: string
  name: string
  icon: string
  archived?: boolean
}
export interface UpNextRoomInput {
  id: string
  palaceId: string
  title: string
  order: number
}
export interface UpNextLocus {
  id: string
  roomId: string
  srs?: SrsState
}

export interface UpNextRoom {
  palaceId: string
  palaceName: string
  palaceIcon: string
  roomId: string
  roomTitle: string
  total: number
  /** Cards with real review debt (already studied and due again). */
  due: number
  /** 0 = has review debt, 1 = in progress, 2 = not started. */
  bucket: 0 | 1 | 2
}

/**
 * Up to `limit` rooms worth studying next, prioritized by review debt → in-progress →
 * untouched. "Due" counts only *started* cards that are due again (brand-new cards are
 * surfaced via the "Not started" bucket, not as review debt), so the three buckets stay
 * distinct. Fully-mastered rooms with nothing due are dropped.
 */
export function pickUpNextRooms(
  palaces: readonly UpNextPalace[],
  rooms: readonly UpNextRoomInput[],
  loci: readonly UpNextLocus[],
  now: number,
  limit = 3,
): UpNextRoom[] {
  const active = new Map(palaces.filter((p) => !p.archived).map((p) => [p.id, p]))

  const candidates: UpNextRoom[] = []
  for (const room of rooms) {
    const palace = active.get(room.palaceId)
    if (!palace) continue
    const roomLoci = loci.filter((locus) => locus.roomId === room.id)
    if (roomLoci.length === 0) continue

    const due = roomLoci.filter((locus) => locus.srs && isDue(locus.srs, now)).length
    const known = roomLoci.filter((locus) => srsStatus(locus.srs) === 'known').length
    const started = roomLoci.some((locus) => locus.srs)
    if (due === 0 && known === roomLoci.length) continue // mastered, nothing to do

    const bucket: 0 | 1 | 2 = due > 0 ? 0 : started ? 1 : 2
    candidates.push({
      palaceId: palace.id,
      palaceName: palace.name,
      palaceIcon: palace.icon,
      roomId: room.id,
      roomTitle: room.title,
      total: roomLoci.length,
      due,
      bucket,
    })
  }

  return candidates
    .sort((a, b) => a.bucket - b.bucket || b.due - a.due || b.total - a.total)
    .slice(0, limit)
}
