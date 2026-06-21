import type { ImportedRoom } from '@/shared/lib'
import type { RoomStore } from '@/entities/room'
import type { LocusStore } from '@/entities/locus'
import type { QuestionStore } from '@/entities/question'
import { createRoom } from '@/features/room'
import { applyRoomContent } from './apply-content'

export interface ImportRoomsResult {
  rooms: number
  loci: number
  questions: number
}

/**
 * Command — bring whole rooms into a palace. Each incoming room is created (appended in
 * order) and then filled with its cards and questions through the create commands, so
 * imports are indistinguishable from hand-made content. Backs the palace's "Import rooms"
 * sheet (a verse paste, an Anki/CSV deck, or another palace's rooms).
 */
export async function importRooms(
  roomStore: RoomStore,
  locusStore: LocusStore,
  questionStore: QuestionStore,
  palaceId: string,
  rooms: ReadonlyArray<ImportedRoom>,
): Promise<ImportRoomsResult> {
  let loci = 0
  let questions = 0
  for (const incoming of rooms) {
    const room = await createRoom(roomStore, palaceId, {
      title: incoming.title,
      description: incoming.description,
    })
    const applied = await applyRoomContent(locusStore, questionStore, room.id, {
      loci: incoming.loci,
      questions: incoming.questions,
    })
    loci += applied.loci
    questions += applied.questions
  }
  return { rooms: rooms.length, loci, questions }
}
